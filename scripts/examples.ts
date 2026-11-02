// Builds the worked insurance flow. All companies, people and prices are fictional.
// List the products with their scope, tiers and documents, quote a cat from the answers
// that Alice already gave, get the questions that are still open, quote with every
// answer, quote an older dog that gets no offer and a pet outside the scope, then
// apply for the cat. Alice approves the application on Example Pets' page, and the
// assistant reads where the application is.
// Then the registry calls: load the rules of France, find the seller with its licence
// check, check three sellers and the insurer.
import type {
  AnswerSource,
  AnswerSources,
  AnswersSchema,
  CoverLimit,
  CoverSummary,
  DateTimeString,
  GetDistributorResult,
  InsuranceDocument,
  Offer,
  Party,
  Product,
  ProductOption,
  ProviderRef,
  UnderwritingScope,
} from "@spec/schema";
import type {
  GetCountryRulesParams,
  LicenceCheck,
  RulesFile,
  ListedDistributor,
  SearchDistributorsParams,
  VerifyLicenceParams,
  VerifyLicenceResult,
} from "@spec/registry";
import { join } from "node:path";
import { examplePath, type ExampleName, type Examples } from "./example-files";

async function write<K extends ExampleName>(name: K, data: Examples[K]): Promise<void> {
  await Bun.write(examplePath(name), JSON.stringify(data, null, 2) + "\n");
}

/* Distributor */

const insurer: ProviderRef = {
  name: "Example Mutual",
  legal_name: "Example Mutual Assurances SA",
  role: "insurer",
  domain: "mutual.example.com",
  lei: "EXAMPLEMUTUAL0000042",
  licences: [
    {
      country: "FR",
      regulator: "ACPR",
      register: "REGAFI",
      identifier_type: "lei",
      identifier: "EXAMPLEMUTUAL0000042",
      role: "insurer",
      verification_url: "https://www.regafi.fr/",
    },
  ],
};

const distributor: GetDistributorResult = {
  legal_name: "Example Pets SAS",
  trading_name: "Example Pets",
  domain: "pets.example.com",
  roles: ["broker"],
  licences: [
    {
      country: "FR",
      regulator: "ACPR",
      register: "ORIAS",
      identifier_type: "orias_number",
      identifier: "00000000",
      role: "broker",
      categories: ["COA"],
      verification_url: "https://www.orias.fr/",
    },
  ],
  countries: ["FR"],
  complaints_url: "https://pets.example.com/complaints",
  aip: {
    version: "0.1",
    conformance_level: 3,
    lines: ["pet"],
    countries: ["FR"],
  },
};

await write("insurance-01-get_distributor.result", distributor);

/* Products, with their scope, their tiers and their documents */

const vetCosts70: CoverLimit = {
  key: "vet_costs_per_year",
  label: "Vet costs per year",
  limit: { amount: "1500.00", currency: "EUR" },
  reimbursement_rate: 0.7,
};
const cover70: CoverSummary = {
  included: ["Accident", "Illness", "Surgery"],
  limits: [vetCosts70],
  excess: { amount: "0.00", currency: "EUR" },
  main_exclusions: ["Pre-existing conditions"],
  waiting_periods: [
    { applies_to: "Accident", days: 0 },
    { applies_to: "Illness", days: 45 },
    { applies_to: "Surgery", days: 45 },
  ],
};
const cover90: CoverSummary = {
  ...cover70,
  limits: [{ ...vetCosts70, limit: { amount: "2500.00", currency: "EUR" }, reimbursement_rate: 0.9 }],
};
const prevention: ProductOption = {
  key: "prevention",
  label: "Forfait prévention",
  price: { amount: { amount: "3.00", currency: "EUR" }, period: "month", taxes_included: true },
};

const ipid: InsuranceDocument = {
  type: "ipid",
  title: "IPID Example Pets Essentiel",
  url: "https://pets.example.com/docs/ipid-essentiel-2026-09.pdf",
  required_before_commitment: true,
};
const generalConditions: InsuranceDocument = {
  type: "general_conditions",
  title: "Conditions générales",
  url: "https://pets.example.com/docs/cg-2026-09.pdf",
  required_before_commitment: true,
};

const scope: UnderwritingScope = {
  geography: { countries: ["FR"] },
  insured: [{ family: "pet", kinds: ["cat", "dog"] }],
  conditions: [
    "The pet lives with the subscriber, in France.",
    "The pet is identified by a microchip or a tattoo.",
    "Not for a dog of category 1 or 2 under French law (attack, guard and defence dogs).",
    "Not for a pet kept for breeding or for professional use.",
  ],
};
const product: Product = {
  product_id: "pet-fr-essentiel",
  name: "Essentiel",
  line: "pet",
  provider: insurer,
  underwriting_scope: scope,
  summary: "Pays back the vet costs of a cat or a dog after an accident or an illness, at 70% or 90%.",
  tiers: [
    { key: "essentiel-70", name: "Essentiel 70", summary: "70% of the vet costs, up to 1,500 EUR a year.", cover: cover70 },
    { key: "essentiel-90", name: "Essentiel 90", summary: "90% of the vet costs, up to 2,500 EUR a year.", cover: cover90 },
  ],
  options: [prevention],
  documents: [ipid, generalConditions],
};

await write("insurance-02-list_products.params", { country: "FR", insured_family: "pet", insured_kind: "cat", language: "fr" });
await write("insurance-03-list_products.result", { products: [product] });

/* First quote, with the answers that Alice already gave. The agent read the
   breed from her photo. The result gives the questions that are still open. */

const answersSchema: AnswersSchema = {
  type: "object",
  properties: {
    country: { type: "string", pattern: "^[A-Z]{2}$", description: "Country where the pet lives." },
    postal_code: { type: "string", description: "Postal code where the pet lives." },
    species: { type: "string", enum: ["dog", "cat"], description: "Is the pet a cat or a dog?" },
    pet_name: { type: "string", description: "Name of the pet." },
    breed: { type: "string", description: "Breed of the pet." },
    sex: { type: "string", enum: ["female", "male"], description: "Sex of the pet." },
    is_neutered: { type: "boolean", description: "Is the pet neutered or spayed?" },
    date_of_birth: { type: "string", format: "date", description: "Date of birth of the pet. An approximate date is fine." },
    lifestyle: { type: "string", enum: ["indoor", "outdoor"], description: "Does the pet go outside?" },
    currently_insured: { type: "boolean", description: "Is the pet insured with another company today?" },
  },
  required: ["country", "postal_code", "species", "pet_name", "breed", "sex", "is_neutered", "date_of_birth", "currently_insured"],
};

const fromCustomer: AnswerSource = { origin: "customer", validated_by_customer: true };
const firstAnswers = { country: "FR", postal_code: "69003", species: "cat", pet_name: "Miso", breed: "European shorthair" };
const firstSources: AnswerSources = {
  country: fromCustomer,
  postal_code: fromCustomer,
  species: fromCustomer,
  pet_name: fromCustomer,
  breed: { origin: "agent", validated_by_customer: false },
};

await write("insurance-04-quote.params.first", {
  product_id: product.product_id,
  answers: firstAnswers,
  answer_sources: firstSources,
  language: "fr",
});

await write("insurance-05-quote.result.needs_input", {
  status: "needs_input",
  answers_schema: answersSchema,
  missing_fields: [
    { field: "sex", issue: "missing" },
    { field: "is_neutered", issue: "missing" },
    { field: "date_of_birth", issue: "missing", message: "An approximate date is fine." },
    { field: "currently_insured", issue: "missing" },
  ],
});

/* Quote with every answer. Alice gives most of them, and her vet clinic gives the date of birth. */

const answers = {
  ...firstAnswers,
  sex: "female",
  is_neutered: true,
  date_of_birth: "2023-04-01",
  lifestyle: "indoor",
  currently_insured: false,
};
const sources: AnswerSources = {
  ...firstSources,
  sex: fromCustomer,
  is_neutered: fromCustomer,
  date_of_birth: { origin: "third_party", validated_by_customer: false, source_name: "veterinary clinic record (FR)" },
  lifestyle: fromCustomer,
  currently_insured: fromCustomer,
};

await write("insurance-06-quote.params.complete", {
  product_id: product.product_id,
  answers,
  answer_sources: sources,
  language: "fr",
});

const offer70: Offer = {
  offer_id: "of-3c81",
  product_id: product.product_id,
  tier: "essentiel-70",
  provider: insurer,
  pricing: {
    premium: { amount: { amount: "14.90", currency: "EUR" }, period: "month", taxes_included: true },
    fees: [],
    cover: cover70,
  },
  valid_until: "2026-11-19T23:59:59+01:00",
  handoff_url: "https://pets.example.com/q/of-3c81",
  documents: [ipid, generalConditions],
};
const offer90: Offer = {
  ...offer70,
  offer_id: "of-3c82",
  tier: "essentiel-90",
  handoff_url: "https://pets.example.com/q/of-3c82",
  pricing: {
    ...offer70.pricing,
    premium: { amount: { amount: "21.40", currency: "EUR" }, period: "month", taxes_included: true },
    cover: cover90,
  },
};

await write("insurance-07-quote.result.offers", { status: "complete", offers: [offer70, offer90] });

/* Two quotes with no offer */

await write("insurance-08-quote.result.no_offer", {
  status: "complete",
  offers: [],
  no_offer: {
    reason_code: "age_not_accepted",
    message: "Example Mutual does not start cover for a dog older than 9 years.",
  },
});

// An agent that follows the rules does not send this quote, because the
// geography of the scope excludes the United Kingdom. The server refuses it anyway.
await write("insurance-09-quote.result.outside_scope", {
  status: "complete",
  offers: [],
  no_offer: {
    reason_code: "outside_underwriting_scope",
    message: "Essentiel covers pets that live in France. Pixel lives in the United Kingdom.",
  },
});

/* Application. The server takes the answers and their sources from the offer. */

const parties: Party[] = [
  {
    party_ref: "p1",
    kind: "person",
    roles: ["subscriber", "insured", "payer"],
    display_name: "Alice",
    country_of_residence: "FR",
  },
];

await write("insurance-10-submit_application.params", { offer_id: offer70.offer_id, parties, language: "en" });

const summary =
  "Apply for Essentiel 70 cat insurance for Miso with Example Mutual: 14.90 EUR a month, " +
  "70% of vet costs up to 1,500 EUR a year, no excess, no fees. " +
  "Check Miso's answers. You said: lives in France, postal code 69003, a female cat named Miso, spayed, stays indoors, not insured today. " +
  "Your assistant read the breed from your photo, and you have not checked it yet: European shorthair. " +
  "Your vet clinic's record gives the date of birth, and you have not checked it yet: 1 April 2023. " +
  "If an answer is false, Example Mutual can refuse to pay a claim or cancel the cover. " +
  "Approve only if each answer is true and complete. Then you sign and pay on the same page.";
const applicationId = "app-3310";
const applicationKey = "k9VdQ2xLm7Rt4Wb1Zp8NcY3s";

await write("insurance-11-submit_application.result", {
  application_id: applicationId,
  application_key: applicationKey,
  summary,
  url: "https://pets.example.com/approve/Hq2xK9mVb3RtL0wPz4N8aJ",
  expires_at: "2026-10-20T11:00:00+02:00",
});

/* Alice approves on Example Pets' page, and the assistant reads the
   application with its ID and its key. */

await write("insurance-12-get_operation.params", { application_id: applicationId, application_key: applicationKey });
await write("insurance-13-get_operation.result.approved", { application_id: applicationId, state: "approved" });

/* Registry: load the rules of France, find Example Pets with its licence check, check three sellers, check the insurer */

/** A rules file of the skill as the registry serves it: the text unchanged. */
async function rulesFile(
  path: string,
  fields: Omit<RulesFile, "owner" | "status" | "language" | "version" | "effective_from" | "content" | "url" | "skill_uri">,
): Promise<RulesFile> {
  const content = await Bun.file(
    join(import.meta.dir, "..", "skills", "agentic-insurance-protocol", "references", "countries", path),
  ).text();
  const version = /^version: (.+)$/m.exec(content)?.[1] ?? "";
  return {
    ...fields,
    version,
    owner: "AIP maintainers",
    status: "draft",
    language: "en",
    effective_from: "2026-10-24",
    content,
    url: `https://registry.example.com/rules/${path.replace(/\.md$/, "")}/${version}.md`,
    skill_uri: `skill://agentic-insurance-protocol/references/countries/${path}`,
  };
}

const rulesParams: GetCountryRulesParams = { country: "FR", line: "pet" };
await write("registry-01-get_country_rules.params", rulesParams);
await write("registry-02-get_country_rules.result", { files: [await rulesFile("fr/country.md", { country: "FR" })] });

const orias = distributor.licences[0];
if (!orias) throw new Error("the worked example distributor has no licence");

const licensedParams: VerifyLicenceParams = {
  capacity: "distributor",
  subject: { domain: distributor.domain },
  country: "FR",
  line: "pet",
};
const mcpUrl = `https://${distributor.domain}/mcp`;

/** A check of Example Pets in ORIAS, as the registry gives it in a search and in `verify_licence`. */
function examplePetsCheck(checkId: string, readAt: DateTimeString, verdictAt: DateTimeString): VerifyLicenceResult {
  if (!orias) throw new Error("the worked example distributor has no licence");
  return {
    check_id: checkId,
    params: licensedParams,
    subject: {
      legal_name: distributor.legal_name,
      domain: distributor.domain,
      domain_link: "register",
      listed: true,
      mcp_url: mcpUrl,
    },
    licences: [
      {
        country: orias.country,
        regulator: orias.regulator,
        register: orias.register,
        identifier_type: orias.identifier_type,
        identifier: orias.identifier,
        role: orias.role,
        status: "active",
        register_status: "Inscrit",
        categories: orias.categories ?? [],
        name_in_register: "EXAMPLE PETS SAS",
        access: "api",
        checked_at: readAt,
        source_url: "https://www.orias.fr/",
      },
    ],
    outcome: {
      verdict: "licensed",
      message: "Example Pets SAS is in the ORIAS register as an insurance broker (COA), and the entry is active.",
    },
    checked_at: verdictAt,
  };
}

const examplePetsListing: ListedDistributor = {
  legal_name: distributor.legal_name,
  ...(distributor.trading_name ? { trading_name: distributor.trading_name } : {}),
  domain: distributor.domain,
  mcp_url: mcpUrl,
  roles: distributor.roles,
  conformance_level: distributor.aip.conformance_level,
  lines: distributor.aip.lines,
  countries: distributor.aip.countries,
  insured_families: ["pet"],
  ...(distributor.complaints_url ? { complaints_url: distributor.complaints_url } : {}),
  // The registry checks each listing again every night, for each market it serves.
  licence_check: examplePetsCheck("chk-4c90", "2026-10-20T03:00:00+02:00", "2026-10-20T03:00:01+02:00"),
  listed_since: "2026-10-01",
};

const searchParams: SearchDistributorsParams = { country: "FR", line: "pet", min_conformance_level: 2 };
await write("registry-03-search_distributors.params", searchParams);
await write("registry-04-search_distributors.result", { distributors: [examplePetsListing] });

// Alice names Example Pets herself, so the agent checks it with verify_licence.
await write("registry-05-verify_licence.params.licensed", licensedParams);
await write(
  "registry-06-verify_licence.result.licensed",
  examplePetsCheck("chk-4d1e", "2026-10-20T09:58:00+02:00", "2026-10-20T09:58:01+02:00"),
);

// A seller that the agent found on the web. Its legal notice gives an ORIAS number that does not exist.
const noLicenceParams: VerifyLicenceParams = {
  capacity: "distributor",
  subject: {
    domain: "petcover.example.com",
    identifier: { country: "FR", identifier_type: "orias_number", identifier: "99031742" },
    legal_name: "Pet Cover Online SARL",
  },
  country: "FR",
  line: "pet",
};
await write("registry-07-verify_licence.params.no_licence", noLicenceParams);
await write("registry-08-verify_licence.result.no_licence", {
  check_id: "chk-4d2a",
  params: noLicenceParams,
  subject: { domain: "petcover.example.com", domain_link: "not_linked", listed: false },
  licences: [
    {
      country: "FR",
      regulator: "ACPR",
      register: "ORIAS",
      identifier_type: "orias_number",
      identifier: "99031742",
      status: "not_found",
      access: "api",
      checked_at: "2026-10-20T09:59:00+02:00",
      source_url: "https://www.orias.fr/",
    },
  ],
  outcome: {
    verdict: "not_licensed",
    reason: "no_entry",
    message:
      "ORIAS has no entry with the number 99031742, and no entry in the name of Pet Cover Online SARL. This seller is not registered to sell insurance in France.",
  },
  checked_at: "2026-10-20T09:59:01+02:00",
});

// Another sale, for a cat in Texas: the rules of the United States, then the rules of pet insurance there.
// Texas has no file of its own yet, so the result holds two files.
const stateLineRulesParams: GetCountryRulesParams = { country: "US", subdivision: "US-TX", line: "pet" };
await write("registry-13-get_country_rules.params.state_line", stateLineRulesParams);
await write("registry-14-get_country_rules.result.state_line", {
  files: [await rulesFile("us/country.md", { country: "US" }), await rulesFile("us/lines/pet.md", { country: "US", line: "pet" })],
});

// A US agency that the registry listed. Its Texas licence lapsed, so the registry removed it from the listing.
const lapsedParams: VerifyLicenceParams = {
  capacity: "distributor",
  subject: { domain: "agency.example.com" },
  country: "US",
  subdivision: "US-TX",
  line: "pet",
};
const agencyLicence = {
  country: "US",
  register: "NIPR Producer Database",
  identifier_type: "npn",
  identifier: "00000000",
  role: "agent",
  categories: ["Property", "Casualty"],
  lines: ["home", "renters", "motor", "pet"],
  name_in_register: "EXAMPLE PET AGENCY LLC",
  access: "api",
  checked_at: "2026-10-21T15:40:00-05:00",
  source_url: "https://nipr.com/",
} satisfies Partial<LicenceCheck>;
await write("registry-09-verify_licence.params.lapsed", lapsedParams);
await write("registry-10-verify_licence.result.lapsed", {
  check_id: "chk-7b90",
  params: lapsedParams,
  subject: { legal_name: "Example Pet Agency LLC", domain: "agency.example.com", domain_link: "confirmed", listed: false },
  licences: [
    {
      ...agencyLicence,
      regulator: "Texas Department of Insurance",
      subdivisions: ["US-TX"],
      status: "lapsed",
      register_status: "Inactive",
      valid_until: "2026-08-31",
    },
    {
      ...agencyLicence,
      regulator: "Oklahoma Insurance Department",
      subdivisions: ["US-OK"],
      status: "active",
      register_status: "Active",
      valid_until: "2027-05-31",
    },
  ],
  outcome: {
    verdict: "not_licensed",
    reason: "licence_not_active",
    message:
      "Example Pet Agency LLC holds no active licence in Texas. Its Texas licence ended on 31 August 2026. Its licence in Oklahoma is active, but it does not cover a customer in Texas.",
  },
  checked_at: "2026-10-21T15:40:01-05:00",
});

// Before it asks the questions, the agent checks the insurer that carries the risk, from Product.provider.
// A provider check can use the register entry alone.
const regafi = insurer.licences[0];
if (!regafi) throw new Error("the worked example insurer has no licence");
const providerParams: VerifyLicenceParams = {
  capacity: "provider",
  subject: { identifier: { country: regafi.country, identifier_type: regafi.identifier_type, identifier: regafi.identifier } },
  country: "FR",
  line: "pet",
};
await write("registry-11-verify_licence.params.provider", providerParams);
await write("registry-12-verify_licence.result.provider", {
  check_id: "chk-4d3c",
  params: providerParams,
  subject: { ...(insurer.legal_name ? { legal_name: insurer.legal_name } : {}), ...(insurer.lei ? { lei: insurer.lei } : {}), listed: false },
  licences: [
    {
      country: regafi.country,
      regulator: regafi.regulator,
      register: regafi.register,
      identifier_type: regafi.identifier_type,
      identifier: regafi.identifier,
      role: regafi.role,
      status: "active",
      register_status: "Actif",
      categories: ["Non-vie"],
      name_in_register: "EXAMPLE MUTUAL ASSURANCES SA",
      access: "api",
      source_date: "2026-10-19",
      checked_at: "2026-10-20T10:00:20+02:00",
      source_url: "https://www.regafi.fr/",
    },
  ],
  outcome: {
    verdict: "licensed",
    message: "Example Mutual Assurances SA is in the ACPR register of insurers, and its authorisation is active.",
  },
  checked_at: "2026-10-20T10:00:21+02:00",
});

console.log("examples written");
