import type { DomainLink, LicenceCheck, ListedDistributor, RegisterIdentifier, RegisterSource } from "../schema.js";
import { fictionalDomain, fictionalUrl } from "../config.js";

/** An entry of a public register, as the registry reads it, with the domains tied to it. */
export interface RegisterEntry extends Omit<LicenceCheck, "checked_at"> {
  legal_name: string;
  domains: { domain: string; link: Extract<DomainLink, "register" | "confirmed"> }[];
}

export const COUNTRIES = ["US", "GB", "FR"];

export const ENTRIES: RegisterEntry[] = [
  {
    country: "FR",
    regulator: "ACPR",
    register: "ORIAS",
    identifier_type: "orias_number",
    identifier: "00000000",
    role: "broker",
    status: "active",
    register_status: "Inscrit",
    categories: ["COA"],
    name_in_register: "EXAMPLE PETS SAS",
    legal_name: "Example Pets SAS",
    access: "api",
    source_url: "https://www.orias.fr/",
    domains: [{ domain: fictionalDomain("pets"), link: "confirmed" }],
  },
  {
    country: "FR",
    regulator: "ACPR",
    register: "REGAFI",
    identifier_type: "lei",
    identifier: "EXAMPLEMUTUAL0000042",
    role: "insurer",
    status: "active",
    register_status: "Actif",
    categories: ["Non-vie"],
    name_in_register: "EXAMPLE MUTUAL ASSURANCES SA",
    legal_name: "Example Mutual Assurances SA",
    access: "api",
    source_url: "https://www.regafi.fr/",
    domains: [{ domain: fictionalDomain("mutual"), link: "confirmed" }],
  },
  ...(["US-TX", "US-OK"] as const).map(
    (state): RegisterEntry => ({
      country: "US",
      regulator: state === "US-TX" ? "Texas Department of Insurance" : "Oklahoma Insurance Department",
      register: "NIPR Producer Database",
      identifier_type: "npn",
      identifier: "00000000",
      role: "agent",
      status: state === "US-TX" ? "lapsed" : "active",
      register_status: state === "US-TX" ? "Inactive" : "Active",
      categories: ["Property", "Casualty"],
      lines: ["home", "renters", "motor", "pet"],
      subdivisions: [state],
      name_in_register: "EXAMPLE PET AGENCY LLC",
      legal_name: "Example Pet Agency LLC",
      valid_until: state === "US-TX" ? "2026-08-31" : "2027-05-31",
      access: "api",
      source_url: "https://nipr.com/",
      domains: [{ domain: fictionalDomain("agency"), link: "confirmed" }],
    }),
  ),
];

export const SOURCES: RegisterSource[] = [
  { country: "FR", register: "ORIAS", regulator: "ACPR", covers: ["intermediaries"], identifier_type: "orias_number", access: "api", url: "https://www.orias.fr/" },
  { country: "FR", register: "REGAFI", regulator: "ACPR", covers: ["insurers"], identifier_type: "lei", access: "api", url: "https://www.regafi.fr/" },
  { country: "GB", register: "FCA Register", regulator: "FCA", covers: ["intermediaries", "insurers"], identifier_type: "fca_frn", access: "api", url: "https://register.fca.org.uk/" },
  { country: "US", register: "NIPR Producer Database", regulator: "State insurance departments", covers: ["intermediaries"], identifier_type: "npn", access: "api", url: "https://nipr.com/" },
];

/** A listed server, before the licence check that each search adds for its market. */
export type Listing = Omit<ListedDistributor, "licence_check">;

/** The servers that the registry lists. */
export const LISTED: Listing[] = [
  {
    legal_name: "Example Pets SAS",
    trading_name: "Example Pets",
    domain: fictionalDomain("pets"),
    mcp_url: fictionalUrl("pets", "/mcp"),
    roles: ["broker"],
    conformance_level: 3,
    lines: ["pet"],
    countries: ["FR"],
    insured_families: ["pet"],
    complaints_url: fictionalUrl("pets", "/complaints"),
    listed_since: "2026-10-24",
  },
];

/**
 * What the MCP server of a domain claims in `get_distributor`, as the registry
 * read it. A claim ties the domain to the entries it names with the link
 * "claimed", which never supports "licensed". The registry reads each entry
 * in its register like any other.
 */
export interface DomainClaim {
  domain: string;
  legal_name: string;
  licences: RegisterIdentifier[];
}

/** The claims of the servers that the registry does not list. Pet Cover Online claims an ORIAS number that the register does not have. */
export const CLAIMS: DomainClaim[] = [
  {
    domain: fictionalDomain("petcover"),
    legal_name: "Pet Cover Online SARL",
    licences: [{ country: "FR", identifier_type: "orias_number", identifier: "99031742" }],
  },
];
