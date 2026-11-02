import type { CallToolResult } from "@modelcontextprotocol/server";
import type { SearchDistributorsParams } from "../schema.js";
import { COUNTRIES, COUNTRY_NAMES, LISTED } from "../data/index.js";
import { fail, ok } from "./result.js";
import { checkLicence } from "./verify-licence.js";

export function searchDistributors(params: SearchDistributorsParams): CallToolResult {
  if (!COUNTRIES.includes(params.country) || !LISTED.some((item) => item.countries.includes(params.country))) {
    return fail(
      "country_not_covered",
      `The registry lists no seller in ${COUNTRY_NAMES[params.country] ?? params.country}. Some sellers can still exist. Check any seller you find with verify_licence.`,
    );
  }
  const distributors = LISTED.filter(
    (item) =>
      item.countries.includes(params.country) &&
      (!params.line || item.lines.includes(params.line)) &&
      (!params.subdivision || !item.subdivisions || item.subdivisions.includes(params.subdivision)) &&
      (!params.insured_family || (item.insured_families ?? []).includes(params.insured_family)) &&
      item.conformance_level >= (params.min_conformance_level ?? 1),
  )
    .flatMap((item) => {
      // A search returns a server only while its check for this market is "licensed".
      const check = checkLicence({
        capacity: "distributor",
        subject: { domain: item.domain },
        country: params.country,
        ...(params.subdivision ? { subdivision: params.subdivision } : {}),
        ...(params.line ? { line: params.line } : {}),
      });
      return check.outcome.verdict === "licensed" ? [{ ...item, licence_check: check }] : [];
    })
    .sort(() => Math.random() - 0.5);
  return ok({ distributors }, `${distributors.length} listed server(s), each with its licence check. The order carries no meaning.`);
}
