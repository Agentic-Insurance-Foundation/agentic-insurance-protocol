// Checks the examples against schema.json, then checks the MUST rules that a
// JSON Schema cannot express. This is the seed of the conformance tests.
import Ajv from "ajv";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { evalFile, ruleExists } from "./evals";
import {
  MAX_READ_AGE_DAYS,
  PER_SUBDIVISION_COUNTRIES,
  REGISTRY_EXTENSION_ID,
  REGISTRY_TOOLS,
  type LicenceCheck,
  type NotLicensedReason,
  type VerifyLicenceParams,
  type VerifyLicenceResult,
} from "@spec/registry";
import { TOOL_NAMES, type AnswerSources, type Answers, type ListProductsParams, type Product, type QuoteResult } from "@spec/schema";
import { EXAMPLE_DEFINITIONS, readExample, type ExampleName } from "./example-files";

const schema = await Bun.file(join(import.meta.dir, "..", "spec", "schema.json")).json();
const draft07 = new Ajv({ allErrors: true, strict: false });
addFormats(draft07);
draft07.addSchema(schema, "aip");
const draft2020 = new Ajv2020({ allErrors: true, strict: false });
addFormats(draft2020);

let failures = 0;

function check(passed: boolean, message: string): void {
  console.log(`${passed ? "PASS" : "FAIL"}  ${message}`);
  if (!passed) failures++;
}

/** Validates data against one definition of schema.json. */
function matchesDefinition(definition: string, data: unknown): { valid: boolean; errors: string } {
  const validator = draft07.getSchema(`aip#/definitions/${definition}`);
  if (!validator) throw new Error(`schema.json has no definition ${definition}`);
  const valid = validator(data) === true;
  return { valid, errors: valid ? "" : ` ${JSON.stringify(validator.errors?.slice(0, 3))}` };
}

function completed(result: QuoteResult): Extract<QuoteResult, { status: "complete" }> {
  if (result.status !== "complete") throw new Error(`quote result is ${result.status}, not complete`);
  return result;
}

function needingInput(result: QuoteResult): Extract<QuoteResult, { status: "needs_input" }> {
  if (result.status !== "needs_input") throw new Error(`quote result is ${result.status}, not needs_input`);
  return result;
}

function sameKeys(answers: Answers, sources: AnswerSources): boolean {
  return isDeepStrictEqual(Object.keys(answers).sort(), Object.keys(sources).sort());
}

function matchesFilters(product: Product, filters: ListProductsParams): boolean {
  const { countries, subdivisions = [] } = product.underwriting_scope.geography;
  if (filters.country && !countries.includes(filters.country)) return false;
  if (filters.subdivision) {
    const country = filters.subdivision.slice(0, 2);
    const listed = subdivisions.filter((code) => code.startsWith(`${country}-`));
    if (!countries.includes(country) || (listed.length > 0 && !listed.includes(filters.subdivision))) return false;
  }
  if (filters.line && product.line !== filters.line) return false;
  if (!filters.insured_family) return filters.insured_kind === undefined;
  const type = product.underwriting_scope.insured.find((candidate) => candidate.family === filters.insured_family);
  if (!type) return false;
  return !filters.insured_kind || type.kinds === undefined || type.kinds.includes(filters.insured_kind);
}

/* Every example matches its definition in schema.json */

for (const name of Object.keys(EXAMPLE_DEFINITIONS) as ExampleName[]) {
  const definition = EXAMPLE_DEFINITIONS[name];
  const { valid, errors } = matchesDefinition(definition, await readExample(name));
  check(valid, `${name} is a valid ${definition}${errors}`);
}

const filters = await readExample("insurance-02-list_products.params");
const products = (await readExample("insurance-03-list_products.result")).products;
const firstParams = await readExample("insurance-04-quote.params.first");
const needsInput = needingInput(await readExample("insurance-05-quote.result.needs_input"));
const completeParams = await readExample("insurance-06-quote.params.complete");
const offersQuote = completed(await readExample("insurance-07-quote.result.offers"));
const noOfferQuote = completed(await readExample("insurance-08-quote.result.no_offer"));
const outsideScopeQuote = completed(await readExample("insurance-09-quote.result.outside_scope"));
const application = await readExample("insurance-11-submit_application.result");
const readParams = await readExample("insurance-12-get_operation.params");
const read = await readExample("insurance-13-get_operation.result.approved");
const distributorDomain = (await readExample("insurance-01-get_distributor.result")).domain;

const answersSchema = needsInput.answers_schema;
const answers = completeParams.answers;
const completeQuotes = [offersQuote, noOfferQuote, outsideScopeQuote];

function productOf(productId: string): Product {
  const product = products.find((candidate) => candidate.product_id === productId);
  if (!product) throw new Error(`list_products has no product ${productId}`);
  return product;
}

/** True when the URL is on the domain, or on one of its subdomains. */
function onDomain(url: string, domain: string | undefined): boolean {
  if (!domain) return false;
  const host = new URL(url).hostname;
  return host === domain || host.endsWith(`.${domain}`);
}

/* Rules R1 to R16 */

const matchesAnswersSchema = draft2020.compile(answersSchema);
check(matchesAnswersSchema(answers) === true, "R1 the questions compile as JSON Schema 2020-12, and the complete answers match them");

const missingRequired = (answersSchema.required ?? []).filter((key) => !(key in firstParams.answers));
check(
  matchesAnswersSchema(firstParams.answers) === false &&
    isDeepStrictEqual(
      needsInput.missing_fields
        .filter((issue) => issue.issue === "missing")
        .map((issue) => issue.field)
        .sort(),
      missingRequired.sort(),
    ),
  "R2 needs_input lists each required answer that the first quote did not give",
);

// A question never asks for an identity number, a bank account or card number, a tax number, health data of a person or a password.
const SENSITIVE = /iban|bank|card|passport|identity|national_id|ssn|social_security|tax|health|medical|password/i;
const sensitiveKeys = Object.keys(answersSchema.properties).filter((key) => SENSITIVE.test(key));
check(sensitiveKeys.length === 0, `R3 no question asks for sensitive data${sensitiveKeys.length ? ` (${sensitiveKeys.join(", ")})` : ""}`);

check(
  products.every((product) => product.documents.some((document) => document.type === "ipid" && document.required_before_commitment)),
  "R4 a non-life insurance product has an IPID required before commitment",
);
check(
  offersQuote.offers.every(
    (offer) =>
      offer.handoff_url === undefined || onDomain(offer.handoff_url, distributorDomain) || onDomain(offer.handoff_url, offer.provider.domain),
  ) && onDomain(application.url, distributorDomain),
  "R5 each handoff_url is on the domain of the seller or of the provider, and the approval page on the domain of the seller",
);
check(
  completeQuotes.every((quote) => quote.offers.length > 0 || (quote.no_offer?.reason_code ?? "") !== ""),
  "R6 an empty quote gives a no_offer reason",
);
check(
  products.every((product) => {
    const { countries, subdivisions = [] } = product.underwriting_scope.geography;
    return subdivisions.every((code) => countries.includes(code.slice(0, 2)));
  }),
  "R7 each subdivision of a scope is in its countries",
);
check(
  products.every((product) => matchesFilters(product, filters)),
  `R8 list_products returns only products that match ${JSON.stringify(filters)}`,
);
check(
  outsideScopeQuote.offers.length === 0 && outsideScopeQuote.no_offer?.reason_code === "outside_underwriting_scope",
  "R9 a risk outside the structured scope gets no offer, and the reason outside_underwriting_scope",
);
check(
  [firstParams, completeParams].every((params) => sameKeys(params.answers, params.answer_sources)),
  "R10 every answer has one source, and every source has an answer",
);
const covers = [
  ...products.flatMap((product) => product.tiers.map((tier) => tier.cover)),
  ...completeQuotes.flatMap((quote) => quote.offers).map((offer) => offer.pricing.cover),
];
check(
  covers.every((cover) => cover.excess === undefined || Number(cover.excess.amount) === 0 || cover.excess_basis !== undefined),
  "R11 each cover with an excess above zero gives its basis",
);

// tools.json gives each tool its MCP input and output schemas. Each example of params or of a result matches them.
interface ToolDefinition {
  name: string;
  inputSchema: object;
  outputSchema: object;
}
const toolsFile = await Bun.file(join(import.meta.dir, "..", "spec", "tools.json")).json();
const toolDefinitions = Object.values(toolsFile.servers as Record<string, { tools: ToolDefinition[] }>).flatMap((server) => server.tools);
const pascal = (tool: string) => tool.replace(/(^|_)([a-z])/g, (_, __, letter: string) => letter.toUpperCase());
const toolMismatches: string[] = [];
for (const name of Object.keys(EXAMPLE_DEFINITIONS) as ExampleName[]) {
  const definition = EXAMPLE_DEFINITIONS[name];
  const tool = toolDefinitions.find((candidate) => [`${pascal(candidate.name)}Params`, `${pascal(candidate.name)}Result`].includes(definition));
  if (!tool) {
    toolMismatches.push(`${name}: no tool`);
    continue;
  }
  const validate = draft2020.compile(definition.endsWith("Params") ? tool.inputSchema : tool.outputSchema);
  if (validate(await readExample(name)) !== true) toolMismatches.push(`${name}: ${JSON.stringify(validate.errors?.slice(0, 2))}`);
}
check(
  toolDefinitions.length === Object.keys(TOOL_NAMES).length + Object.keys(REGISTRY_TOOLS).length && toolMismatches.length === 0,
  `R12 tools.json defines the ${toolDefinitions.length} tools, and every example matches the schema of its tool${toolMismatches.length ? ` ${toolMismatches.join("; ")}` : ""}`,
);

check(
  readParams.application_id === application.application_id &&
    readParams.application_key === application.application_key &&
    read.application_id === application.application_id &&
    /^[A-Za-z0-9_-]{22,}$/.test(application.application_key) &&
    /\/[A-Za-z0-9_-]{22,}$/.test(new URL(application.url).pathname) &&
    !application.url.includes(application.application_id) &&
    !application.url.includes(application.application_key),
  "R13 the page token and the application_key are two keys of 128 bits or more, apart from the application_id, and get_operation reads the application with its ID and its key",
);
check(
  /approve only if each answer is true and complete/i.test(application.summary),
  "R14 the summary of an application asks the customer to approve only answers that are true and complete, so that the approval confirms the answers",
);
check(
  covers.some((cover) => (cover.waiting_periods ?? []).length > 0) &&
    covers.every((cover) => (cover.waiting_periods ?? []).every((period) => cover.included.includes(period.applies_to))),
  "R15 each waiting period applies to a cover of included",
);
check(
  products.every((product) => new Set(product.tiers.map((tier) => tier.key)).size === product.tiers.length) &&
    completeQuotes.every((quote) =>
      quote.offers.every((offer) => {
        const tier = productOf(offer.product_id).tiers.find((candidate) => candidate.key === offer.tier);
        return tier !== undefined && isDeepStrictEqual(offer.pricing.cover.included, tier.cover.included);
      }),
    ),
  "R16 each tier of a product has its own key, and each offer prices a tier of its product, with the covers of that tier",
);

/* Registry rules RG1 to RG10 */

const searchParams = await readExample("registry-03-search_distributors.params");
const search = await readExample("registry-04-search_distributors.result");
check(
  search.distributors.every(
    (listing) =>
      listing.countries.includes(searchParams.country) &&
      (searchParams.line === undefined || listing.lines.includes(searchParams.line)) &&
      (searchParams.subdivision === undefined ||
        listing.subdivisions === undefined ||
        listing.subdivisions.includes(searchParams.subdivision)) &&
      (searchParams.insured_family === undefined || (listing.insured_families ?? []).includes(searchParams.insured_family)) &&
      listing.conformance_level >= (searchParams.min_conformance_level ?? 1),
  ),
  `RG1 the ${search.distributors.length} search result(s) match every param of the search`,
);

const providerRole = schema.definitions.ProviderRole as { const?: string; enum?: string[] };
const providerRoles = providerRole.enum ?? (providerRole.const ? [providerRole.const] : []);
const NOT_LICENSED_REASONS: NotLicensedReason[] = [
  "no_entry",
  "subdivision_not_covered",
  "line_not_covered",
  "role_not_covered",
  "licence_not_active",
];

/** How many of the five tests of `VerifyLicenceResult` an entry passes, in order. 5 means that it covers the question. */
function testsPassed(entry: LicenceCheck, params: VerifyLicenceParams): number {
  const tests = [
    entry.status !== "not_found" && (entry.country === params.country || (entry.passports ?? []).includes(params.country)),
    entry.subdivisions === undefined || (params.subdivision !== undefined && entry.subdivisions.includes(params.subdivision)),
    entry.lines === undefined || params.line === undefined || entry.lines.includes(params.line),
    params.capacity !== "provider" || (entry.role !== undefined && providerRoles.includes(entry.role)),
    entry.status === "active",
  ];
  const failed = tests.indexOf(false);
  return failed < 0 ? tests.length : failed;
}

/** The verdict that the entries give, before the domain link and the registers that did not answer. */
function verdictFromEntries(result: VerifyLicenceResult): { verdict: "licensed" } | { verdict: "not_licensed"; reason: NotLicensedReason } {
  let best = -1;
  let bestEntry: LicenceCheck | undefined;
  for (const entry of result.licences) {
    const passed = testsPassed(entry, result.params);
    if (passed > best) [best, bestEntry] = [passed, entry];
  }
  if (best === 5) return { verdict: "licensed" };
  if (best === 4 && bestEntry?.status === "name_mismatch") return { verdict: "not_licensed", reason: "name_mismatch" };
  return { verdict: "not_licensed", reason: NOT_LICENSED_REASONS[Math.max(best, 0)] ?? "no_entry" };
}

const DAY_MS = 24 * 60 * 60 * 1000;
const verifications = [
  ["registry-05-verify_licence.params.licensed", "registry-06-verify_licence.result.licensed"],
  ["registry-07-verify_licence.params.no_licence", "registry-08-verify_licence.result.no_licence"],
  ["registry-09-verify_licence.params.lapsed", "registry-10-verify_licence.result.lapsed"],
  ["registry-11-verify_licence.params.provider", "registry-12-verify_licence.result.provider"],
] as const;

for (const [paramsName, resultName] of verifications) {
  const params = await readExample(paramsName);
  const result = await readExample(resultName);
  const fromEntries = verdictFromEntries(result);
  const domainGiven = "domain" in result.params.subject;
  const domainLinked = result.subject.domain_link === "register" || result.subject.domain_link === "confirmed";
  const { outcome } = result;
  let follows: boolean;
  if (outcome.verdict === "unknown") {
    follows =
      outcome.reason === "domain_not_linked"
        ? fromEntries.verdict === "licensed" && domainGiven && !domainLinked
        : fromEntries.verdict === "not_licensed";
  } else if (outcome.verdict === "licensed") {
    follows = fromEntries.verdict === "licensed" && (!domainGiven || domainLinked);
  } else {
    follows = fromEntries.verdict === "not_licensed" && fromEntries.reason === outcome.reason;
  }
  check(follows, `RG2 ${resultName}: the verdict ${outcome.verdict} follows from the entries`);

  const verdictAt = Date.parse(result.checked_at);
  check(
    result.licences.every((entry) => {
      const age = verdictAt - Date.parse(entry.checked_at);
      return age >= 0 && age <= MAX_READ_AGE_DAYS * DAY_MS;
    }),
    `RG3 ${resultName}: every entry was read at most ${MAX_READ_AGE_DAYS} days before the verdict`,
  );
  check(isDeepStrictEqual(result.params, params), `RG4 ${resultName} repeats the params of the call`);
  check(
    !PER_SUBDIVISION_COUNTRIES.includes(params.country) || params.subdivision !== undefined,
    `RG5 ${paramsName} gives a subdivision where licences apply per subdivision`,
  );
}

for (const listing of search.distributors) {
  const result = listing.licence_check;
  const { params } = result;
  const verdictAt = Date.parse(result.checked_at);
  check(
    params.capacity === "distributor" &&
      "domain" in params.subject &&
      params.subject.domain === listing.domain &&
      params.country === searchParams.country &&
      params.subdivision === searchParams.subdivision &&
      params.line === searchParams.line &&
      result.outcome.verdict === "licensed" &&
      verdictFromEntries(result).verdict === "licensed" &&
      (result.subject.domain_link === "register" || result.subject.domain_link === "confirmed") &&
      result.licences.every((entry) => {
        const age = verdictAt - Date.parse(entry.checked_at);
        return age >= 0 && age <= MAX_READ_AGE_DAYS * DAY_MS;
      }),
    `RG10 the licence check of ${listing.domain} in the search checks that server for the market of the search, and its verdict licensed follows from entries read at most ${MAX_READ_AGE_DAYS} days before`,
  );
}

/** The top-level `key: value` lines of a YAML front matter. Lists and nested keys are left out. */
function frontMatter(content: string): Record<string, string> {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(content);
  if (!match?.[1]) return {};
  const values: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const pair = /^([a-z_]+): (.+)$/.exec(line);
    if (pair?.[1] && pair[2]) values[pair[1]] = pair[2];
  }
  return values;
}

const SKILL_DIR = join(import.meta.dir, "..", "skills", "agentic-insurance-protocol");

/** The path in this repository of a file of the skill, from its `skill://agentic-insurance-protocol/...` URI. */
function skillPath(uri: string): string | null {
  const match = /^skill:\/\/agentic-insurance-protocol\/(.+)$/.exec(uri);
  return match?.[1] ? join(SKILL_DIR, match[1]) : null;
}

const FRONT_MATTER_KEYS = [
  "country",
  "subdivision",
  "line",
  "version",
  "owner",
  "status",
  "endorsed_by",
  "reviewed_at",
  "language",
  "effective_from",
] as const;
const RULES_EXAMPLES = [
  ["registry-01-get_country_rules.params", "registry-02-get_country_rules.result"],
  ["registry-13-get_country_rules.params.state_line", "registry-14-get_country_rules.result.state_line"],
] as const;
for (const [paramsName, resultName] of RULES_EXAMPLES) {
  const rulesParams = await readExample(paramsName);
  const rules = await readExample(resultName);
  for (const file of rules.files) {
    const header = frontMatter(file.content);
    const label = `rules file ${[file.country, file.subdivision, file.line].filter(Boolean).join(" ")} ${file.version}`;
    check(
      FRONT_MATTER_KEYS.every((key) => header[key] === file[key]) &&
        (file.status !== "endorsed" || file.endorsed_by !== undefined),
      `RG6 ${label}: the front matter matches the file`,
    );
    const path = file.skill_uri ? skillPath(file.skill_uri) : null;
    const inSkill = path && (await Bun.file(path).exists()) ? await Bun.file(path).text() : null;
    check(inSkill === file.content, `RG9 ${label}: the text is the file of the skill at ${file.skill_uri}`);
  }
  const [countryFile, ...moreFiles] = rules.files;
  const firstLineFile = moreFiles.findIndex((file) => file.line !== undefined);
  check(
    countryFile?.country === rulesParams.country &&
      countryFile.subdivision === undefined &&
      countryFile.line === undefined &&
      moreFiles.every(
        (file) =>
          file.country === rulesParams.country &&
          (file.subdivision === undefined || file.subdivision === rulesParams.subdivision) &&
          (file.line === undefined || file.line === rulesParams.line),
      ) &&
      (firstLineFile < 0 || moreFiles.slice(firstLineFile).every((file) => file.subdivision === undefined)),
    `RG7 ${resultName}: the rules start with the file of the country, then the files of the subdivision and the line asked`,
  );
}

// No customer data: the params of each registry tool are closed objects, and hold only these fields.
const MARKET_AND_COMPANY_FIELDS = new Set([
  "country",
  "subdivision",
  "line",
  "insured_family",
  "min_conformance_level",
  "cursor",
  "subject",
  "domain",
  "identifier",
  "identifier_type",
  "register",
  "legal_name",
  "capacity",
]);

interface SchemaNode {
  $ref?: string;
  properties?: Record<string, SchemaNode>;
  additionalProperties?: unknown;
  anyOf?: SchemaNode[];
  items?: SchemaNode;
}

/** The field names of a definition and of the objects it refers to, or null when one object is open. */
function fieldNames(node: SchemaNode, seen = new Set<string>()): string[] | null {
  if (node.$ref) {
    const name = node.$ref.replace("#/definitions/", "");
    if (seen.has(name)) return [];
    seen.add(name);
    return fieldNames(schema.definitions[name] as SchemaNode, seen);
  }
  const parts: (string[] | null)[] = [];
  if (node.properties) {
    if (node.additionalProperties !== false) return null;
    parts.push(Object.keys(node.properties));
    for (const property of Object.values(node.properties)) parts.push(fieldNames(property, seen));
  }
  for (const variant of node.anyOf ?? []) parts.push(fieldNames(variant, seen));
  if (node.items) parts.push(fieldNames(node.items, seen));
  return parts.includes(null) ? null : parts.flatMap((part) => part ?? []);
}

const paramsDefinitions = ["SearchDistributorsParams", "VerifyLicenceParams", "GetCountryRulesParams"];
check(
  paramsDefinitions.every((definition) => {
    const names = fieldNames({ $ref: `#/definitions/${definition}` });
    return names !== null && names.every((name) => MARKET_AND_COMPANY_FIELDS.has(name));
  }),
  `RG8 the params of the ${paramsDefinitions.length} registry tools hold no customer data`,
);

/* Skill SK1 to SK4 */

const skillText = await Bun.file(join(SKILL_DIR, "SKILL.md")).text();
const skillHeader = frontMatter(skillText);
const skillName = skillHeader["name"] ?? "";
const skillDescription = skillHeader["description"] ?? "";
const SKILL_MAX_LINES = 30;
check(
  skillName === "agentic-insurance-protocol" &&
    /^[a-z0-9]+(-[a-z0-9]+)*$/.test(skillName) &&
    skillDescription.startsWith("Use this when") &&
    skillDescription.length <= 1024 &&
    skillText.trimEnd().split("\n").length <= SKILL_MAX_LINES,
  `SK1 SKILL.md has the name of its folder, a description that starts "Use this when", and at most ${SKILL_MAX_LINES} lines`,
);

// SKILL.md points to each file. The guidelines name every tool of the seller and of the registry.
const guidelinesText = await Bun.file(join(SKILL_DIR, "guidelines.md")).text();
const allToolNames = [...Object.keys(TOOL_NAMES), ...Object.keys(REGISTRY_TOOLS)];
const namedFiles = [...skillText.matchAll(/`([a-z0-9/._-]+\.md)`/g)].map((match) => match[1] ?? "");
const missingFiles: string[] = [];
for (const file of namedFiles) if (!(await Bun.file(join(SKILL_DIR, file)).exists())) missingFiles.push(file);
check(
  namedFiles.includes("guidelines.md") &&
    missingFiles.length === 0 &&
    allToolNames.every((tool) => guidelinesText.includes(`\`${tool}\``)),
  `SK2 SKILL.md points to the guidelines and to files that exist, and the guidelines name each of the ${allToolNames.length} tools`,
);

// A country folder holds country.md, and files of states in states/ and of lines in lines/.
const countriesDir = join(SKILL_DIR, "references", "countries");
const rulesFiles: { path: string; country: string; subdivision?: string; line?: string }[] = [];
for (const code of (await readdir(countriesDir)).sort()) {
  const entries = await readdir(join(countriesDir, code));
  check(
    entries.includes("country.md") && entries.every((entry) => ["country.md", "states", "lines"].includes(entry)),
    `SK3 countries/${code}/ holds country.md, and only states/ and lines/ besides`,
  );
  rulesFiles.push({ path: `${code}/country.md`, country: code.toUpperCase() });
  for (const [folder, key] of [["states", "subdivision"], ["lines", "line"]] as const) {
    if (!entries.includes(folder)) continue;
    for (const name of (await readdir(join(countriesDir, code, folder))).sort()) {
      const value = name.replace(/\.md$/, "");
      rulesFiles.push({
        path: `${code}/${folder}/${name}`,
        country: code.toUpperCase(),
        [key]: key === "subdivision" ? value.toUpperCase() : value,
      });
    }
  }
}
for (const file of rulesFiles) {
  const content = await Bun.file(join(countriesDir, file.path)).text();
  const header = frontMatter(content);
  const body = content.replace(/^---\n[\s\S]*?\n---\n/, "");
  check(
    file.path.endsWith(".md") &&
      header["country"] === file.country &&
      header["subdivision"] === file.subdivision &&
      header["line"] === file.line &&
      (file.subdivision === undefined || file.subdivision.startsWith(`${file.country}-`)) &&
      /^\d+\.\d+\.\d+$/.test(header["version"] ?? "") &&
      header["owner"] !== undefined &&
      header["language"] !== undefined &&
      /^\d{4}-\d{2}-\d{2}$/.test(header["effective_from"] ?? "") &&
      (header["status"] === "draft" || (header["status"] === "endorsed" && header["endorsed_by"] !== undefined)) &&
      /^sources:\n {2}- title: .+\n {4}url: https:\/\//m.test(content) &&
      /^# .+$/m.test(body),
    `SK3 rules file ${file.path}: the front matter matches its place and gives the version, owner, status, language, date and sources`,
  );
  // Each rule is one item of a numbered list. A file with no legal review marks each rule "Not reviewed".
  const items = body.split("\n").filter((line) => /^\d+\. /.test(line));
  check(
    items.length > 0 &&
      items.every((item) => item.includes("Source:")) &&
      (header["reviewed_at"] !== undefined || items.every((item) => item.endsWith("Not reviewed."))),
    `SK4 rules file ${file.path}: each of the ${items.length} rules gives its source and its review status`,
  );
}

/* Evaluation SK5 */

// Each test case names the customer's country, its risk and the rules it tests,
// and each rule is a section of a specification or an item of a file of the skill.
const evals = evalFile();
const unknownRules = evals.evals.flatMap((item) => (item.rules ?? []).filter((rule) => !ruleExists(rule)).map((rule) => `${item.id}: ${rule}`));
check(
  evals.skill_name === skillName &&
    new Set(evals.evals.map((item) => item.id)).size === evals.evals.length &&
    evals.evals.every(
      (item) =>
        /^[A-Z]{2}$/.test(item.country ?? "") &&
        Boolean(item.risk) &&
        Boolean(item.prompt) &&
        (item.assertions ?? []).length > 0 &&
        (item.rules ?? []).length > 0,
    ) &&
    unknownRules.length === 0,
  `SK5 each of the ${evals.evals.length} test cases names its country, its risk and the rules it tests, and each rule exists${unknownRules.length ? ` (unknown: ${unknownRules.join("; ")})` : ""}`,
);

console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
