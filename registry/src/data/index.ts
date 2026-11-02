import type { RegisterIdentifierType, RegisterSource } from "../schema.js";
import { TEST_DATA } from "../config.js";
import * as test from "./test-data.js";

/** Countries where the registry checks licences and lists servers. */
export const COUNTRIES: string[] = TEST_DATA ? test.COUNTRIES : [];
/** Every public register the registry reads. */
export const SOURCES: RegisterSource[] = TEST_DATA ? test.SOURCES : [];
export const ENTRIES: test.RegisterEntry[] = TEST_DATA ? test.ENTRIES : [];
export const LISTED: test.Listing[] = TEST_DATA ? test.LISTED : [];
export const CLAIMS: test.DomainClaim[] = TEST_DATA ? test.CLAIMS : [];

export const COUNTRY_NAMES: Record<string, string> = { US: "the United States", GB: "the United Kingdom", FR: "France" };

/** The register that holds each kind of identifier, to report an identifier that the registry did not find. */
export const REGISTERS: { country: string; type: RegisterIdentifierType; regulator: string; register: string; url: string }[] = [
  { country: "FR", type: "orias_number", regulator: "ACPR", register: "ORIAS", url: "https://www.orias.fr/" },
  { country: "FR", type: "lei", regulator: "ACPR", register: "REGAFI", url: "https://www.regafi.fr/" },
  { country: "FR", type: "siren", regulator: "ACPR", register: "REGAFI", url: "https://www.regafi.fr/" },
  { country: "GB", type: "fca_frn", regulator: "FCA", register: "FCA Register", url: "https://register.fca.org.uk/" },
  { country: "US", type: "npn", regulator: "State insurance departments", register: "NIPR Producer Database", url: "https://nipr.com/" },
  { country: "US", type: "naic_cocode", regulator: "NAIC", register: "NAIC Company Search", url: "https://content.naic.org/cis_consumer_information.htm" },
];
