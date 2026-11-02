import type { CallToolResult } from "@modelcontextprotocol/server";
import type { GetCountryRulesParams, RulesFile } from "../schema.js";
import { publicUrl } from "../config.js";
import { RULES_FILES } from "../generated/rules-files.js";
import { fail, ok } from "./result.js";

export function getCountryRules(params: GetCountryRulesParams): CallToolResult {
  const files = countryRules(params);
  if (files.length === 0) return fail("country_not_covered", `AIP has no rules file for ${params.country} yet.`);
  return ok({ files }, `${files.length} rules file(s): ${files.map((file) => file.url).join(", ")}.`);
}

/** The countries that have a rules file, for example "FR" for fr/country.md. */
export const RULES_COUNTRIES = Object.keys(RULES_FILES)
  .filter((path) => path.endsWith("/country.md"))
  .map((path) => path.split("/")[0]!.toUpperCase());

/** The fields of the front matter of a rules file. */
export function frontMatter(content: string): Record<string, string> {
  const block = content.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const fields: Record<string, string> = {};
  for (const line of block.split("\n")) {
    const match = line.match(/^([a-z_]+):\s*(.+)$/);
    if (match?.[1] && match[2]) fields[match[1]] = match[2].replace(/^"|"$/g, "");
  }
  return fields;
}

function rulesFile(path: string, content: string): RulesFile {
  const meta = frontMatter(content);
  return {
    country: meta.country ?? "",
    ...(meta.subdivision ? { subdivision: meta.subdivision } : {}),
    ...(meta.line ? { line: meta.line } : {}),
    version: meta.version ?? "",
    owner: meta.owner ?? "",
    status: meta.status === "endorsed" ? "endorsed" : "draft",
    ...(meta.endorsed_by ? { endorsed_by: meta.endorsed_by } : {}),
    ...(meta.reviewed_at ? { reviewed_at: meta.reviewed_at } : {}),
    effective_from: meta.effective_from ?? "",
    language: meta.language ?? "en",
    content,
    url: `${publicUrl()}/rules/${path}`,
    skill_uri: `skill://agentic-insurance-protocol/references/countries/${path}`,
  };
}

/** The files for the params: the country first, then the subdivision and the line when they have a file. Empty when the country has none. */
function countryRules(params: GetCountryRulesParams): RulesFile[] {
  const folder = params.country.toLowerCase();
  if (!RULES_FILES[`${folder}/country.md`]) return [];
  const paths = [
    `${folder}/country.md`,
    ...(params.subdivision ? [`${folder}/states/${params.subdivision.toLowerCase()}.md`] : []),
    ...(params.line ? [`${folder}/lines/${params.line}.md`] : []),
  ];
  return paths.flatMap((path) => {
    const content = RULES_FILES[path];
    return content === undefined ? [] : [rulesFile(path, content)];
  });
}
