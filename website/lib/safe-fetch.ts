import { lookup as dnsLookup, type LookupAddress, type LookupOptions } from "node:dns";
import { request } from "node:https";
import { BlockList, isIP } from "node:net";

// Reads an address that a seller gives, with the rules of section 2.1 of the
// registry spec: HTTPS on port 443 only, on a host whose addresses are all
// public, with a limit on the time and the size of each read. The check of the
// addresses runs in the DNS lookup of each connection, so a DNS answer that
// changes after a check cannot send the read to a private network. A redirect
// to another host fails. The caller shows the seller the kind of failure, and
// never the body or the error text of the address.

export type FetchFailure = "not_https" | "private_address" | "unreachable" | "timeout" | "too_large" | "redirect";

export type FetchResult =
  | { ok: true; status: number; headers: Record<string, string | string[] | undefined>; body: string }
  | { ok: false; failure: FetchFailure };

type FetchOptions = {
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string;
  maxBytes: number;
  timeoutMs: number;
  // For a stream that the server keeps open: return true when the body holds
  // what the caller needs, and the read stops there.
  done?: (body: string) => boolean;
};

// The IPv4 ranges that are not public (RFC 6890 and the IANA special-purpose registry).
const PRIVATE_V4 = new BlockList();
for (const [address, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 3],
] as const) {
  PRIVATE_V4.addSubnet(address, prefix, "ipv4");
}

// An IPv6 address is public only in 2000::/3, and outside the special ranges
// in it. This also refuses the IPv6 forms of an IPv4 address, such as ::ffff:10.0.0.1.
const GLOBAL_V6 = new BlockList();
GLOBAL_V6.addSubnet("2000::", 3, "ipv6");
const SPECIAL_V6 = new BlockList();
for (const [address, prefix] of [
  ["2001::", 23],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["3fff::", 20],
] as const) {
  SPECIAL_V6.addSubnet(address, prefix, "ipv6");
}

function isPublic({ address, family }: LookupAddress): boolean {
  if (family === 4) return !PRIVATE_V4.check(address, "ipv4");
  return GLOBAL_V6.check(address, "ipv6") && !SPECIAL_V6.check(address, "ipv6");
}

class FetchError extends Error {
  constructor(readonly failure: FetchFailure) {
    super(failure);
  }
}

// The lookup of each connection. It refuses the host when one of its addresses is not public.
function publicLookup(
  hostname: string,
  options: LookupOptions,
  callback: (error: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void,
): void {
  dnsLookup(hostname, { family: options.family ?? 0, all: true }, (error, addresses) => {
    if (error) return callback(error, "");
    if (addresses.length === 0 || !addresses.every(isPublic)) return callback(new FetchError("private_address"), "");
    if (options.all) return callback(null, addresses);
    const [first] = addresses as [LookupAddress];
    callback(null, first.address, first.family);
  });
}

// Whether an address is HTTPS on port 443, on a host name. A host that is an
// IP address skips the lookup, so it is refused here.
export function isAllowedUrl(url: URL): boolean {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  return url.protocol === "https:" && (url.port === "" || url.port === "443") && !url.username && !url.password && isIP(host) === 0;
}

function readOnce(url: URL, options: FetchOptions): Promise<FetchResult> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: FetchResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const req = request(
      url,
      {
        method: options.method ?? "GET",
        headers: { "accept-encoding": "identity", "user-agent": "aip-registry-check/0.1", ...options.headers },
        lookup: publicLookup,
      },
      (res) => {
        const length = Number(res.headers["content-length"]);
        if (length > options.maxBytes) {
          req.destroy();
          return finish({ ok: false, failure: "too_large" });
        }
        const chunks: Buffer[] = [];
        let size = 0;
        const result = (): FetchResult => ({ ok: true, status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks).toString("utf8") });
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > options.maxBytes) {
            req.destroy();
            return finish({ ok: false, failure: "too_large" });
          }
          chunks.push(chunk);
          if (options.done?.(Buffer.concat(chunks).toString("utf8"))) {
            finish(result());
            req.destroy();
          }
        });
        res.on("end", () => finish(result()));
        res.on("error", () => finish({ ok: false, failure: "unreachable" }));
      },
    );
    const timer = setTimeout(() => {
      finish({ ok: false, failure: "timeout" });
      req.destroy();
    }, options.timeoutMs);
    req.on("error", (error) => finish({ ok: false, failure: error instanceof FetchError ? error.failure : "unreachable" }));
    req.end(options.body);
  });
}

// Reads an address. A GET follows at most three redirects on the same host. A POST follows none.
export async function safeFetch(address: string, options: FetchOptions): Promise<FetchResult> {
  let url: URL;
  try {
    url = new URL(address);
  } catch {
    return { ok: false, failure: "not_https" };
  }
  for (let hop = 0; hop <= 3; hop++) {
    if (!isAllowedUrl(url)) return { ok: false, failure: "not_https" };
    const result = await readOnce(url, options);
    if (!result.ok || result.status < 300 || result.status >= 400) return result;
    const location = result.headers.location;
    if (typeof location !== "string" || options.method === "POST") return { ok: false, failure: "redirect" };
    const next = new URL(location, url);
    if (next.hostname !== url.hostname) return { ok: false, failure: "redirect" };
    url = next;
  }
  return { ok: false, failure: "redirect" };
}
