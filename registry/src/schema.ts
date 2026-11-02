/**
 * The types and the tools of the AIP registry, draft 0.1. This file is the
 * source of truth: the server checks each call and each result with these zod
 * schemas, and gives their JSON Schema in tools/list. `scripts/generate.ts`
 * writes the registry part of `spec/schema.json` and `spec/tools.json` from it.
 * The rules are in `docs/0.1/registry.mdx`.
 */

import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* Types of spec/schema.ts                                                    */
/* -------------------------------------------------------------------------- */

// scripts/generate.ts checks that each one accepts the same values as in spec/schema.ts.

export const CountryCode = z
  .string()
  .regex(/^[A-Z]{2}$/)
  .describe("ISO 3166-1 alpha-2 country code, upper case.");
export type CountryCode = z.infer<typeof CountryCode>;

export const SubdivisionCode = z
  .string()
  .regex(/^[A-Z]{2}-[A-Z0-9]{1,3}$/)
  .describe('ISO 3166-2 subdivision code, upper case, for example "US-CA" for California.');
export type SubdivisionCode = z.infer<typeof SubdivisionCode>;

export const Lei = z
  .string()
  .regex(/^[A-Z0-9]{18}[0-9]{2}$/)
  .describe("Legal Entity Identifier (ISO 17442).");
export type Lei = z.infer<typeof Lei>;

export const LanguageTag = z
  .string()
  .regex(/^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/)
  .describe("BCP 47 language tag, for example `fr` or `en-GB`.");
export type LanguageTag = z.infer<typeof LanguageTag>;

export const DateString = z.string().meta({ format: "date", description: "Calendar date, ISO 8601." });
export type DateString = z.infer<typeof DateString>;

export const DateTimeString = z.string().meta({ format: "date-time", description: "Date and time with offset, ISO 8601." });
export type DateTimeString = z.infer<typeof DateTimeString>;

export const Url = z.url();
export type Url = z.infer<typeof Url>;

export const ProductLine = z
  .string()
  .regex(/^[a-z][a-z0-9_]*$/)
  .describe('Product line, for example "pet" or "home".');
export type ProductLine = z.infer<typeof ProductLine>;

export const InsuredFamily = z
  .string()
  .regex(/^[a-z][a-z0-9_]*$/)
  .describe('Family of what a product insures, for example "pet" or "dwelling".');
export type InsuredFamily = z.infer<typeof InsuredFamily>;

export const ConformanceLevel = z.literal([1, 2, 3]).describe("Conformance level of a server: 1 Inform, 2 Quote, 3 Subscribe.");
export type ConformanceLevel = z.infer<typeof ConformanceLevel>;

export const ProviderRole = z.literal("insurer").describe("Role of the party that carries the risk.");
export type ProviderRole = z.infer<typeof ProviderRole>;

export const DistributorRole = z
  .union([ProviderRole, z.literal("broker"), z.literal("agent"), z.literal("mga"), z.literal("comparator")])
  .describe("Role of a party in the distribution chain.");
export type DistributorRole = z.infer<typeof DistributorRole>;

export const RegisterIdentifierType = z
  .enum(["orias_number", "siren", "fca_frn", "npn", "naic_cocode", "lei", "other"])
  .describe("Kind of public register identifier.");
export type RegisterIdentifierType = z.infer<typeof RegisterIdentifierType>;

/* ========================================================================== */
/* 1. Common types                                                            */
/* ========================================================================== */

export const DomainName = z
  .string()
  .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/)
  .describe('Host name, lower case, with no scheme, port or path, for example "pets.example.com".');
export type DomainName = z.infer<typeof DomainName>;

export const RegisterIdentifier = z
  .strictObject({
    country: CountryCode.describe("Country of the register."),
    identifier_type: RegisterIdentifierType,
    identifier: z.string(),
    register: z.string().optional().describe('Name of the register. Give it when `identifier_type` is "other".'),
  })
  .describe("An entry in a public register.");
export type RegisterIdentifier = z.infer<typeof RegisterIdentifier>;

export const SourceAccess = z.enum(["api", "bulk_file", "web_page"]).describe("How the registry reads a public register.");
export type SourceAccess = z.infer<typeof SourceAccess>;

export const RegisterSource = z
  .object({
    country: CountryCode,
    subdivisions: z.array(SubdivisionCode).optional().describe("Subdivisions that this source covers. Omit when it covers the whole country."),
    register: z.string().describe('Name of the register, for example "ORIAS".'),
    regulator: z.string(),
    covers: z.array(z.enum(["intermediaries", "insurers"])),
    identifier_type: RegisterIdentifierType,
    access: SourceAccess,
    url: Url.describe("Public home page of the register."),
  })
  .describe("A public register that the registry reads.");
export type RegisterSource = z.infer<typeof RegisterSource>;

/* ========================================================================== */
/* 2. Licence check                                                           */
/* ========================================================================== */

/** Most days between the read of a register entry and a verdict that rests on it. */
export const MAX_READ_AGE_DAYS = 7;

/** Countries where a licence applies per subdivision. A check there gives the subdivision. */
export const PER_SUBDIVISION_COUNTRIES: CountryCode[] = ["US"];

export const VerifyLicenceParams = z
  .strictObject({
    capacity: z
      .enum(["distributor", "provider"])
      .describe('"distributor" for a seller, "provider" for the party that carries the risk, for example the insurer in `Offer.provider`.'),
    subject: z.strictObject({
      domain: DomainName.optional().describe("Domain of the MCP server or the website that receives the customer's answers. REQUIRED for a seller."),
      identifier: RegisterIdentifier.optional().describe("Register entry that the party shows, for example in the legal notice of its website."),
      legal_name: z.string().optional().describe("Legal name that the party shows."),
    }),
    country: CountryCode.describe("Country where the customer buys."),
    subdivision: SubdivisionCode.optional().describe("Subdivision where the customer buys. REQUIRED in the United States."),
    line: ProductLine.optional(),
  })
  .refine((params) => params.subject.domain !== undefined || (params.capacity === "provider" && params.subject.identifier !== undefined), {
    message: "Give the domain that receives the customer's answers. A provider check can give a register entry instead.",
    path: ["subject"],
  })
  .describe("Params of `verify_licence`. They name a company and a market, never a person.");
export type VerifyLicenceParams = z.infer<typeof VerifyLicenceParams>;

export const LicenceStatus = z
  .enum(["active", "pending", "lapsed", "suspended", "revoked", "not_found", "name_mismatch"])
  .describe("Status of one register entry, as the registry reads it.");
export type LicenceStatus = z.infer<typeof LicenceStatus>;

export const LicenceCheck = z
  .object({
    country: CountryCode,
    regulator: z.string(),
    register: z.string(),
    identifier_type: RegisterIdentifierType,
    identifier: z.string(),
    role: DistributorRole.optional().describe('Role that the entry gives. Omit when the status is "not_found".'),
    status: LicenceStatus,
    register_status: z.string().optional().describe('The status in the words of the register, for example "Inscrit".'),
    categories: z.array(z.string()).optional().describe('Register categories, for example ORIAS "COA".'),
    lines: z.array(ProductLine).optional().describe("Lines that the categories cover. Omit when they cover every line."),
    subdivisions: z.array(SubdivisionCode).optional().describe("Subdivisions where the entry applies. Omit when it covers the whole country."),
    passports: z.array(CountryCode).optional().describe("Other countries where the entry may operate (EU and EEA)."),
    name_in_register: z.string().optional(),
    valid_until: DateString.optional(),
    access: SourceAccess,
    source_date: DateString.optional().describe("Date of the data in the source, when it is older than the read."),
    checked_at: DateTimeString.describe("When the registry read this entry."),
    source_url: Url.describe("Public page where anyone can check the entry."),
  })
  .describe("The result of reading one entry in one public register.");
export type LicenceCheck = z.infer<typeof LicenceCheck>;

export const DomainLink = z
  .enum(["register", "confirmed", "claimed", "not_linked"])
  .describe('How the registry tied the domain to the entries. Only "register" and "confirmed" support "licensed".');
export type DomainLink = z.infer<typeof DomainLink>;

export const NotLicensedReason = z.enum([
  "no_entry",
  "licence_not_active",
  "name_mismatch",
  "role_not_covered",
  "subdivision_not_covered",
  "line_not_covered",
]);
export type NotLicensedReason = z.infer<typeof NotLicensedReason>;

export const UnknownReason = z.enum([
  "country_not_covered",
  "subdivision_required",
  "register_unavailable",
  "subject_not_identified",
  "domain_not_linked",
]);
export type UnknownReason = z.infer<typeof UnknownReason>;

const message = z.string().describe("Plain-language explanation that the AI agent can pass to the customer.");

export const LicenceVerdict = z.union([
  z.object({ verdict: z.literal("licensed"), message }),
  z.object({ verdict: z.literal("not_licensed"), reason: NotLicensedReason, message }),
  z.object({ verdict: z.literal("unknown"), reason: UnknownReason, message }),
]);
export type LicenceVerdict = z.infer<typeof LicenceVerdict>;

export const VerifyLicenceResult = z
  .object({
    check_id: z.string(),
    params: VerifyLicenceParams.describe("The params of the call, so that the result is a complete record alone."),
    subject: z.object({
      legal_name: z.string().optional(),
      lei: Lei.optional(),
      domain: DomainName.optional(),
      domain_link: DomainLink.optional(),
      listed: z.boolean().describe("True when the registry lists the MCP server of the domain."),
      mcp_url: Url.optional().describe("MCP endpoint of the listed server."),
    }),
    licences: z.array(LicenceCheck).describe("Every entry the registry read for the party."),
    outcome: LicenceVerdict,
    checked_at: DateTimeString,
  })
  .describe("Result of `verify_licence`. Keep it with the record of the sale.");
export type VerifyLicenceResult = z.infer<typeof VerifyLicenceResult>;

/* ========================================================================== */
/* 3. Search                                                                  */
/* ========================================================================== */

/** Days between two checks of a listed server, at most. */
export const RECHECK_DAYS = 7;

export const ListedDistributor = z
  .object({
    legal_name: z.string(),
    trading_name: z.string().optional(),
    lei: Lei.optional(),
    domain: DomainName,
    mcp_url: Url.describe("MCP endpoint of the server."),
    roles: z.array(DistributorRole),
    conformance_level: ConformanceLevel,
    lines: z.array(ProductLine),
    countries: z.array(CountryCode),
    subdivisions: z.array(SubdivisionCode).optional().describe("Subdivisions where the server holds a licence. Omit when its licence covers the whole country."),
    insured_families: z.array(InsuredFamily).optional(),
    complaints_url: Url.optional(),
    licence_check: VerifyLicenceResult.describe("The licence check of the server for the market of the search. Its verdict is \"licensed\"."),
    listed_since: DateString,
  })
  .describe("A server that the registry lists.");
export type ListedDistributor = z.infer<typeof ListedDistributor>;

export const SearchDistributorsParams = z
  .strictObject({
    country: CountryCode.describe("Country where the customer buys."),
    subdivision: SubdivisionCode.optional().describe("Subdivision where the customer buys, for example a US state."),
    line: ProductLine.optional(),
    insured_family: InsuredFamily.optional(),
    min_conformance_level: ConformanceLevel.optional().describe("Return only servers of this level or above."),
    cursor: z.string().optional(),
  })
  .describe("Params of `search_distributors`. They describe a market, never a person.");
export type SearchDistributorsParams = z.infer<typeof SearchDistributorsParams>;

export const SearchDistributorsResult = z
  .object({
    distributors: z.array(ListedDistributor),
    next_cursor: z.string().optional(),
  })
  .describe("Result of `search_distributors`. The order carries no meaning: never show it as a ranking.");
export type SearchDistributorsResult = z.infer<typeof SearchDistributorsResult>;

/* ========================================================================== */
/* 4. Country rules                                                           */
/* ========================================================================== */

export const GetCountryRulesParams = z
  .strictObject({
    country: CountryCode,
    subdivision: SubdivisionCode.optional().describe("Adds the file of this subdivision, when one exists."),
    line: ProductLine.optional().describe("Adds the file of this line, when one exists."),
  })
  .describe("Params of `get_country_rules`.");
export type GetCountryRulesParams = z.infer<typeof GetCountryRulesParams>;

export const RulesFile = z
  .object({
    country: CountryCode,
    subdivision: SubdivisionCode.optional(),
    line: ProductLine.optional(),
    version: z.string(),
    owner: z.string(),
    status: z.enum(["draft", "endorsed"]),
    endorsed_by: z.string().optional(),
    reviewed_at: DateString.optional(),
    effective_from: DateString,
    language: LanguageTag,
    content: z.string().describe("The whole file, unchanged, front matter included."),
    url: Url.describe("Public HTTPS address of the same file."),
    skill_uri: z.string().optional().describe("URI of the same file in the AIP skill."),
  })
  .describe("One rules file of the AIP skill: Markdown with a YAML front matter that gives the same values as these fields.");
export type RulesFile = z.infer<typeof RulesFile>;

export const GetCountryRulesResult = z
  .object({ files: z.array(RulesFile).min(1) })
  .describe("Result of `get_country_rules`: the file of the country first. Follow every file.");
export type GetCountryRulesResult = z.infer<typeof GetCountryRulesResult>;

/* ========================================================================== */
/* 5. Errors                                                                  */
/* ========================================================================== */

/** What each error code means. */
export const REGISTRY_ERRORS = {
  country_not_covered: "The registry lists no server in this country, or has no rules file for it.",
};

export const RegistryErrorCode = z.enum(["country_not_covered"]);
export type RegistryErrorCode = z.infer<typeof RegistryErrorCode>;

export const RegistryError = z
  .object({ code: RegistryErrorCode, message: z.string() })
  .describe("Error of a registry tool, in `structuredContent.error` of a result with `isError: true`.");
export type RegistryError = z.infer<typeof RegistryError>;

/* ========================================================================== */
/* 6. Registry server                                                         */
/* ========================================================================== */

/** Identifier of the registry extension in MCP `capabilities.extensions`. */
export const REGISTRY_EXTENSION_ID = "org.agenticinsuranceprotocol/registry";

export const RegistrySettings = z
  .object({
    version: z.string(),
    countries: z.array(CountryCode).describe("Countries where the registry checks licences and lists servers."),
    rules_countries: z.array(CountryCode).describe("Countries that have a rules file."),
    sources: z.array(RegisterSource),
    policy_url: Url.describe("Page where the operator publishes how it lists servers and checks licences."),
    listing_url: Url.describe("Page where a distributor asks to be listed."),
  })
  .describe("Settings of the registry extension, in its MCP `server/discover` response.");
export type RegistrySettings = z.infer<typeof RegistrySettings>;

/** Every registry tool is read-only. */
export const REGISTRY_TOOL_ANNOTATIONS = { readOnlyHint: true, destructiveHint: false, idempotentHint: true };

export const REGISTRY_TOOLS = {
  search_distributors: {
    description:
      "The sellers that speak AIP in a market, each with a licence check for that market. Send a market, never a person. The order is random, so never show it as a ranking.",
    params: SearchDistributorsParams,
    result: SearchDistributorsResult,
  },
  verify_licence: {
    description:
      "Check in the public registers that a seller, or the insurer behind an offer, holds an active licence for a market. Send a company and a market, never a person.",
    params: VerifyLicenceParams,
    result: VerifyLicenceResult,
  },
  get_country_rules: {
    description: "The rules that an AI agent follows in a country, and in a state or a line when a file exists. Follow every file of the result.",
    params: GetCountryRulesParams,
    result: GetCountryRulesResult,
  },
};

export type RegistryToolName = keyof typeof REGISTRY_TOOLS;
