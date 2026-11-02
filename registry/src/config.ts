/**
 * True when the registry serves the fictional entries of test-data.ts.
 * `TEST_DATA=1` turns them on, for local runs. Production
 * leaves it unset: there the registry reads no register and lists no server yet.
 */
export const TEST_DATA = process.env.TEST_DATA === "1";

/** The public address of this registry, for the URLs that its results give. */
export function publicUrl(): string {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/**
 * Where a fictional company runs, from its first label, for example "pets".
 * By default it is `https://{label}.example.com`, as in the worked example of
 * the spec. `FICTIONAL_ORIGIN` changes it, for example to
 * `http://{label}.example.localhost:4100`, so that the results point to
 * sellers that run on this machine.
 */
function fictionalOrigin(label: string): URL {
  const template = process.env.FICTIONAL_ORIGIN ?? "https://{label}.example.com";
  if (!template.includes("{label}")) throw new Error(`FICTIONAL_ORIGIN must hold {label}, for example http://{label}.example.localhost:4100. It is ${template}.`);
  return new URL(template.replaceAll("{label}", label));
}

/** The domain of a fictional company, with no scheme or port, for example "pets.example.com". */
export function fictionalDomain(label: string): string {
  return fictionalOrigin(label).hostname;
}

/** A URL of a fictional company, for example `fictionalUrl("pets", "/mcp")`. */
export function fictionalUrl(label: string, path: string): string {
  return `${fictionalOrigin(label).origin}${path}`;
}

/** Where a seller asks to be listed: the form of the AIP site. The operator checks each request by hand. */
export const LISTING_URL = "https://agenticinsuranceprotocol.org/submit";

/** The registry spec on the AIP site, which defines each tool. */
export const SPEC_URL = "https://docs.agenticinsuranceprotocol.org/0.1/registry";
