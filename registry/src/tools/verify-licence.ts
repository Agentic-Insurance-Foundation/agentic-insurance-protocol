import type { CallToolResult } from "@modelcontextprotocol/server";
import {
  PER_SUBDIVISION_COUNTRIES,
  type DomainLink,
  type LicenceCheck,
  type LicenceVerdict,
  type NotLicensedReason,
  type RegisterIdentifier,
  type UnknownReason,
  type VerifyLicenceParams,
  type VerifyLicenceResult,
} from "../schema.js";
import { CLAIMS, COUNTRIES, COUNTRY_NAMES, ENTRIES, LISTED, REGISTERS } from "../data/index.js";
import type { RegisterEntry } from "../data/test-data.js";
import { ok } from "./result.js";

export function verifyLicence(params: VerifyLicenceParams): CallToolResult {
  const result = checkLicence(params);
  return ok(result, `${result.outcome.verdict}: ${result.outcome.message}`);
}

/** True when both name the same entry of the same register. */
function sameEntry(a: RegisterIdentifier, b: Pick<LicenceCheck, "country" | "identifier_type" | "identifier">): boolean {
  return a.country === b.country && a.identifier_type === b.identifier_type && a.identifier === b.identifier;
}

function normalise(name: string): string {
  return name.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** True when the name that the seller shows and the name in the register are the same company. */
function sameName(shown: string | undefined, inRegister: string | undefined): boolean {
  if (!shown || !inRegister) return true;
  const a = normalise(shown);
  const b = normalise(inRegister);
  return a.includes(b) || b.includes(a);
}

/** The five tests of `VerifyLicenceResult` in schema.ts, in order. */
function tests(params: VerifyLicenceParams): [NotLicensedReason, (entry: LicenceCheck) => boolean][] {
  return [
    ["no_entry", (entry) => entry.status !== "not_found" && (entry.country === params.country || (entry.passports ?? []).includes(params.country))],
    ["subdivision_not_covered", (entry) => !entry.subdivisions || !params.subdivision || entry.subdivisions.includes(params.subdivision)],
    ["line_not_covered", (entry) => !entry.lines || !params.line || entry.lines.includes(params.line)],
    ["role_not_covered", (entry) => params.capacity !== "provider" || entry.role === "insurer"],
    ["licence_not_active", (entry) => entry.status === "active"],
  ];
}

/** The verdict for the params. `search_distributors` gives it for each listed server. */
export function checkLicence(params: VerifyLicenceParams): VerifyLicenceResult {
  const checkedAt = new Date().toISOString();
  const checkId = `chk-${crypto.randomUUID().slice(0, 8)}`;
  const { subject } = params;
  const domain = subject.domain;
  const where = COUNTRY_NAMES[params.country] ?? params.country;
  const done = (fields: Pick<VerifyLicenceResult, "subject" | "licences" | "outcome">): VerifyLicenceResult => ({
    check_id: checkId,
    params,
    ...fields,
    checked_at: checkedAt,
  });
  const unknown = (reason: UnknownReason, message: string, licences: LicenceCheck[] = []) =>
    done({ subject: { ...(domain ? { domain } : {}), listed: false }, licences, outcome: { verdict: "unknown", reason, message } });

  if (!COUNTRIES.includes(params.country)) {
    return unknown("country_not_covered", `The registry reads no register for ${where}. It cannot say if this party holds a licence there.`);
  }
  if (PER_SUBDIVISION_COUNTRIES.includes(params.country) && !params.subdivision) {
    return unknown("subdivision_required", `Licences in ${where} apply per state. Call again with the subdivision, for example US-TX.`);
  }

  // The entries to read: the one that the params give, and the ones that the
  // MCP server of the domain claims in get_distributor. The legal name that the
  // server declares counts as the name that the seller shows.
  const claim = domain ? CLAIMS.find((item) => item.domain === domain) : undefined;
  const asked: RegisterIdentifier[] = [];
  for (const item of [...(subject.identifier ? [subject.identifier] : []), ...(claim?.licences ?? [])]) {
    if (!asked.some((other) => sameEntry(other, item))) asked.push(item);
  }
  const legalName = subject.legal_name ?? claim?.legal_name;

  // Every entry of the party: by the register entries it shows or claims, and by its domain.
  // Each row keeps its register entry, so that the domain link is the link of that entry.
  type Row = { entry?: RegisterEntry; check: LicenceCheck };
  const rows: Row[] = ENTRIES.filter(
    (entry) => asked.some((item) => sameEntry(item, entry)) || (domain && entry.domains.some((item) => item.domain === domain)),
  ).map((entry) => {
    const { legal_name: _name, domains: _domains, ...check } = entry;
    return {
      entry,
      check: { ...check, status: sameName(legalName, check.name_in_register) ? check.status : "name_mismatch", checked_at: checkedAt },
    };
  });
  for (const identifier of asked) {
    if (rows.some(({ check }) => sameEntry(identifier, check))) continue;
    const register = REGISTERS.find((item) => item.country === identifier.country && item.type === identifier.identifier_type);
    rows.push({
      check: {
        country: identifier.country,
        regulator: register?.regulator ?? "unknown",
        register: register?.register ?? identifier.register ?? "unknown",
        identifier_type: identifier.identifier_type,
        identifier: identifier.identifier,
        status: "not_found",
        access: "api",
        checked_at: checkedAt,
        source_url: register?.url ?? "https://agenticinsuranceprotocol.org/",
      },
    });
  }
  const licences = rows.map(({ check }) => check);

  if (rows.length === 0) {
    return unknown(
      "subject_not_identified",
      `The registry could not tie ${domain} to any entry in the registers of ${where}. Ask the seller for its register number, for example its ORIAS number, and check again with it.`,
    );
  }

  /** How the domain of the params is tied to the entry of one row: by the register or the holder, or only by the claim of the domain. */
  const linkOf = (row: Row | undefined): DomainLink =>
    row?.entry?.domains.find((item) => item.domain === domain)?.link ??
    (row && claim?.licences.some((item) => sameEntry(item, row.check)) ? "claimed" : "not_linked");
  const linked = (row: Row) => !domain || ["register", "confirmed"].includes(linkOf(row));

  const covering = rows.filter(({ check }) => tests(params).every(([, test]) => test(check)));
  // An entry makes the party licensed only when that same entry is tied to the domain.
  const licensed = covering.find(linked);
  let best: { passed: number; reason: NotLicensedReason; row: Row } | undefined;
  for (const row of rows) {
    const failed = tests(params).findIndex(([, test]) => !test(row.check));
    if (failed === -1) continue;
    const reason = row.check.status === "name_mismatch" && failed === 4 ? "name_mismatch" : (tests(params)[failed]?.[0] ?? "no_entry");
    if (!best || failed > best.passed) best = { passed: failed, reason, row };
  }

  const basis = licensed ?? covering[0] ?? best?.row;
  const listed = LISTED.find((item) => item.domain === domain);
  const checked = {
    ...(basis?.entry ? { legal_name: basis.entry.legal_name } : claim ? { legal_name: claim.legal_name } : {}),
    ...(domain ? { domain, domain_link: linkOf(basis) } : {}),
    listed: Boolean(listed),
    ...(listed ? { mcp_url: listed.mcp_url } : {}),
  };

  const holder = basis?.entry?.legal_name ?? legalName ?? domain ?? "This party";
  let outcome: LicenceVerdict;
  if (licensed) {
    const entry = licensed.check;
    const what = params.capacity === "provider" ? "an insurer" : `an insurance ${entry.role}`;
    const categories = entry.categories?.length ? ` (${entry.categories.join(", ")})` : "";
    outcome = {
      verdict: "licensed",
      message: `${holder} is in the ${entry.register} register (${entry.regulator}) as ${what}${categories}, and the entry is active.`,
    };
  } else if (covering[0]) {
    const entry = covering[0].check;
    const tie = linkOf(covering[0]) === "claimed" ? `only ${domain} says that it is its own` : `nothing ties it to ${domain}`;
    outcome = {
      verdict: "unknown",
      reason: "domain_not_linked",
      message: `${entry.register} has an active entry ${entry.identifier}, but ${tie}. The registry cannot say that this website belongs to the holder of the entry.`,
    };
  } else {
    const entry = best?.row.check;
    const reason = best?.reason ?? "no_entry";
    const messages: Record<NotLicensedReason, string> = {
      no_entry: `${entry?.register} has no entry with the number ${entry?.identifier}${legalName ? `, and no entry in the name of ${legalName}` : ""}. This seller is not registered to sell insurance in ${where}.`,
      licence_not_active: `${holder} holds no active licence for this. Its entry in ${entry?.register} is ${entry?.status}${entry?.valid_until ? ` since ${entry.valid_until}` : ""}.`,
      name_mismatch: `The entry ${entry?.identifier} in ${entry?.register} is in the name of ${entry?.name_in_register}, not ${legalName}.`,
      role_not_covered: `${holder} is in ${entry?.register} as ${entry?.role}, which cannot carry the risk.`,
      subdivision_not_covered: `${holder} holds an active licence in ${entry?.subdivisions?.join(", ")}, but not in ${params.subdivision}.`,
      line_not_covered: `${holder} holds an active licence, but its categories do not cover ${params.line}.`,
    };
    outcome = { verdict: "not_licensed", reason, message: messages[reason] };
  }
  return done({ subject: checked, licences, outcome });
}
