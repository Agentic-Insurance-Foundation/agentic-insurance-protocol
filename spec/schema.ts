/**
 * Agentic Insurance Protocol (AIP): schema, draft 0.1
 *
 * AIP defines how an AI agent finds, prices and applies for an insurance
 * product with any seller. Draft 0.1 covers the sale only. Servicing after the
 * sale comes in a later draft.
 *
 * This file is the source of truth. `schema.json` is generated from it. Do not
 * edit `schema.json` by hand.
 *
 * AIP is an extension of MCP (https://modelcontextprotocol.io/specification/2026-07-28).
 * MCP carries every call. Each tool in this file is an MCP tool. Results go in
 * `structuredContent`, and the same JSON as text in `content`, as MCP asks for
 * clients that read only `content`. A tool MAY add a short plain-text summary
 * in a text block before the JSON.
 *
 * The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
 * "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" are to be
 * read as described in BCP 14 (RFC 2119, RFC 8174) when, and only when, they
 * appear in all capitals.
 *
 * Status: DRAFT 0.1. A later draft MAY break compatibility with this one until 1.0.
 *
 * Inputs for this draft: the MCP tools of a pet insurer (FR), of a home and
 * motor insurer and of a US commercial insurer, the list of agent actions that
 * a US insurer publishes, and MCP 2026-07-28.
 */

/* ========================================================================== */
/* 1. Identity of the extension                                               */
/* ========================================================================== */

/**
 * Identifier of AIP in MCP `capabilities.extensions`. It uses the reverse
 * domain of agenticinsuranceprotocol.org, as MCP asks for third-party
 * extensions.
 */
export const EXTENSION_ID = "org.agenticinsuranceprotocol/aip";

/** Version of this draft. */
export const PROTOCOL_VERSION = "0.1";

/**
 * Conformance level that a seller declares.
 *
 * - 1 Inform: `get_distributor`, `list_products`
 * - 2 Quote: level 1, plus `quote`
 * - 3 Subscribe: level 2, plus `submit_application` and `get_operation`
 *
 * A server that declares a level MUST implement every tool of that level and
 * of the levels below it.
 */
export type ConformanceLevel = 1 | 2 | 3;

/**
 * Settings object of the extension. A server puts it under
 * `capabilities.extensions["org.agenticinsuranceprotocol/aip"]` in its MCP
 * `server/discover` response, and in its `AipDocument`.
 */
export interface AipSettings {
  /**
   * Protocol version the server implements, "major.minor", for example "0.1".
   * Until 1.0, a client MUST treat a different minor version as a different
   * protocol.
   */
  version: string;
  conformance_level: ConformanceLevel;
  /** Product lines the server can quote. */
  lines: ProductLine[];
  /** Countries where the server's products are sold. */
  countries: CountryCode[];
}

/**
 * The AIP document of a seller, at `https://{domain}/.well-known/aip.json`.
 * It leads from a domain to its MCP server. The seller MUST serve it from that
 * host, with no redirect to another host, so that the document proves that the
 * seller controls the domain.
 */
export interface AipDocument {
  /** The domain that serves this document. */
  domain: string;
  /** MCP endpoint of the server. */
  mcp_url: Url;
  aip: AipSettings;
}

/* ========================================================================== */
/* 2. Common types                                                            */
/* ========================================================================== */

/**
 * ISO 3166-1 alpha-2 country code, upper case.
 * @pattern ^[A-Z]{2}$
 */
export type CountryCode = string;

/**
 * ISO 3166-2 subdivision code, upper case, for example "US-CA" for California.
 * @pattern ^[A-Z]{2}-[A-Z0-9]{1,3}$
 */
export type SubdivisionCode = string;

/**
 * ISO 4217 currency code.
 * @pattern ^[A-Z]{3}$
 */
export type CurrencyCode = string;

/**
 * Legal Entity Identifier (ISO 17442): 18 letters or digits, then 2 check digits.
 * @pattern ^[A-Z0-9]{18}[0-9]{2}$
 */
export type Lei = string;

/**
 * BCP 47 language tag, for example `fr` or `en-GB`.
 * @pattern ^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$
 */
export type LanguageTag = string;

/**
 * Calendar date, ISO 8601.
 * @format date
 */
export type DateString = string;

/**
 * Date and time with offset, ISO 8601.
 * @format date-time
 */
export type DateTimeString = string;

/** @format uri */
export type Url = string;

/**
 * A decimal number as a string, so that no value is lost to floating point,
 * for example "12.90".
 * @pattern ^-?[0-9]+(\.[0-9]+)?$
 */
export type Decimal = string;

export interface Money {
  amount: Decimal;
  currency: CurrencyCode;
}

/**
 * Product line. Servers SHOULD use a value of `KnownProductLine`. Other values
 * MUST be lower case with underscores.
 * @pattern ^[a-z][a-z0-9_]*$
 */
export type ProductLine = string;

/** Common product lines. */
export type KnownProductLine =
  // Personal
  | "pet"
  | "home"
  | "renters"
  | "motor"
  | "travel"
  | "health"
  | "life"
  | "funeral"
  | "borrower_insurance"
  // Commercial
  | "professional_liability"
  | "general_liability"
  | "business_owners_policy"
  | "workers_compensation";

/**
 * Family of what a product insures: a kind of person, or a kind of good.
 * Servers SHOULD use a value of `KnownInsuredFamily`. Other values MUST be lower
 * case with underscores.
 * @pattern ^[a-z][a-z0-9_]*$
 */
export type InsuredFamily = string;

/** Families that the known product lines need. */
export type KnownInsuredFamily =
  // People
  /** A person, for example in travel, health, life, funeral and borrower insurance. */
  | "person"
  /** A company or another organisation, in the commercial lines. */
  | "organisation"
  // Goods
  /** A pet. Kinds, for example "cat" and "dog". */
  | "pet"
  /** A building where people live. Kinds, for example "house" and "apartment". */
  | "dwelling"
  /** The furniture and the belongings in a home. */
  | "contents"
  /** A vehicle. Kinds, for example "car", "motorcycle" and "van". */
  | "vehicle";

/* ========================================================================== */
/* 3. Distributor (level 1)                                                   */
/* ========================================================================== */

/**
 * Role of a party in the distribution chain. The provider roles are in
 * `ProviderRole`.
 */
export type DistributorRole =
  | ProviderRole
  // Intermediaries
  | "broker"
  | "agent"
  | "mga"
  | "comparator";

/** Kind of public register identifier. */
export type RegisterIdentifierType =
  /** France, ORIAS (insurance intermediaries). */
  | "orias_number"
  /** France, SIREN company number (9 digits), for example in REGAFI (insurers). */
  | "siren"
  /** United Kingdom, FCA Firm Reference Number. */
  | "fca_frn"
  /** United States, National Producer Number (NIPR, insurance). */
  | "npn"
  /** United States, NAIC company code of an insurer (5 digits). */
  | "naic_cocode"
  /** Legal Entity Identifier (ISO 17442), any country. Use it when the register lists the entry by its LEI. */
  | "lei"
  /** Any other register. Name it in `register`. */
  | "other";

/** One entry in a public register that gives the right to sell a product, or to carry its risk. */
export interface Licence {
  country: CountryCode;
  /** Supervising authority, for example "ACPR", "FCA", or a US state insurance department. */
  regulator: string;
  /** Name of the public register, for example "ORIAS", "REGAFI", "FCA Register", "NIPR". */
  register: string;
  identifier_type: RegisterIdentifierType;
  identifier: string;
  role: DistributorRole;
  /**
   * Register categories, for example ORIAS "COA" (insurance broker) or "AGA"
   * (tied insurance agent).
   */
  categories?: string[];
  /**
   * Subdivisions where the licence applies, for example US states as ISO
   * 3166-2 codes ("US-CA"). Omit when the licence covers the whole country.
   */
  subdivisions?: SubdivisionCode[];
  /** Public page where anyone can check the entry. */
  verification_url?: Url;
}

/** Params of `get_distributor`. No params. */
export interface GetDistributorParams {}

export interface GetDistributorResult {
  legal_name: string;
  trading_name?: string;
  /** Domain the seller controls. It MUST match the server's own domain. */
  domain: string;
  /** Legal Entity Identifier, when the seller has one. The registry uses it to match one company across registers. */
  lei?: Lei;
  roles: DistributorRole[];
  /** Every licence the seller relies on to sell the listed products. */
  licences: Licence[];
  countries: CountryCode[];
  /** Where a customer can complain. Required by most regulators. */
  complaints_url?: Url;
  /** Settings the server declares for AIP. */
  aip: AipSettings;
}

/* ========================================================================== */
/* 4. Products and documents (level 1)                                        */
/* ========================================================================== */

/** Role of the party that carries the risk. */
export type ProviderRole = "insurer";

/** The party that carries the risk. */
export interface ProviderRef {
  name: string;
  legal_name?: string;
  role: ProviderRole;
  /** Domain the provider controls, so that an agent can find it in the registry. */
  domain?: string;
  /** Legal Entity Identifier, when the provider has one. */
  lei?: Lei;
  /**
   * The register entries that allow the provider to carry the risk, for
   * example its authorisation as an insurer. At least one.
   * @minItems 1
   */
  licences: Licence[];
}

export interface Product {
  product_id: string;
  name: string;
  line: ProductLine;
  /** Provider of the product, when it is not the seller. */
  provider?: ProviderRef;
  /** The risks the product can cover. A product MUST publish it. */
  underwriting_scope: UnderwritingScope;
  summary: string;
  /**
   * The tiers of the product, each with its cover and no price, for example
   * "Bronze", "Silver" and "Gold". A product with one level of cover has one
   * tier. `quote` gives one offer for each tier that can cover the customer.
   * @minItems 1
   */
  tiers: ProductTier[];
  /** Options the customer can add to a tier (optional covers, extra services). */
  options?: ProductOption[];
  /** The documents of the product, such as the IPID and the general conditions. */
  documents: InsuranceDocument[];
}

/** One level of cover of a product. The price comes only from `quote`, because it depends on the customer. */
export interface ProductTier {
  /** Stable key, unique in the product, for example "gold". `Offer.tier` gives it. */
  key: string;
  /** Name of the tier, for example "Gold", "Tous risques" or "Band B". */
  name: string;
  /** What the tier is for, in plain words. */
  summary?: string;
  cover: CoverSummary;
}

/**
 * The risks a product can cover. `list_products` gives it with no customer
 * data, so that an agent can drop a product that cannot cover the customer
 * before it asks a question.
 *
 * `geography` and `insured` are the structured part. A server MUST NOT return
 * an offer for a risk outside the structured part. An agent MUST NOT send
 * answers to `quote` for a product whose structured part excludes the
 * customer. `conditions` holds the rest.
 */
export interface UnderwritingScope {
  geography: Geography;
  /**
   * What the product insures. At least one.
   * @minItems 1
   */
  insured: InsuredType[];
  /**
   * The conditions that a machine cannot check, in plain words, for example
   * "Houses built after 1950 only" or "Not for people over 70". Empty when there
   * are none. An agent SHOULD check them against what the customer said before
   * it quotes, and ask the customer when it is not sure.
   */
  conditions: string[];
}

/** Where the insured person lives, or where the insured good is. */
export interface Geography {
  /**
   * Countries the product covers. At least one.
   * @minItems 1
   */
  countries: CountryCode[];
  /**
   * Subdivisions the product covers, for example US states. Each one MUST
   * belong to a country in `countries`. The product covers the whole of each
   * country that has no subdivision in this list.
   */
  subdivisions?: SubdivisionCode[];
}

/** A family of insured, and the kinds of it that a product covers. */
export interface InsuredType {
  family: InsuredFamily;
  /** Kinds that the product covers, for example "cat" and "dog". Omit when it covers every kind. */
  kinds?: string[];
}

/** Kind of document. */
export type DocumentType =
  | "pre_contract_information"
  | "terms_of_business"
  | "other"
  /** Insurance Product Information Document: IDD art. 20 in France, ICOBS 6 in the United Kingdom. */
  | "ipid"
  | "general_conditions"
  /** Statement of the customer's demands and needs: IDD art. 20 in France, ICOBS 5.2 in the United Kingdom. */
  | "demands_and_needs";

/**
 * A document of a product or of an offer. `list_products` gives the documents
 * of each product in `Product.documents`, and `quote` the documents of each
 * offer in `Offer.documents`.
 */
export interface InsuranceDocument {
  type: DocumentType;
  title: string;
  url: Url;
  /**
   * True when the law requires that the customer receives this document
   * before they commit, for example the IPID.
   */
  required_before_commitment: boolean;
}

/**
 * Params of `list_products`. Each filter is optional. The server MUST return
 * only the products whose line and underwriting scope match every filter given.
 * With `country`, `subdivision`, `insured_family` and `insured_kind`, the
 * filters cover the whole structured part of the scope, so the agent has only
 * the `conditions` left to check.
 */
export interface ListProductsParams {
  country?: CountryCode;
  /** Products that cover this subdivision. */
  subdivision?: SubdivisionCode;
  line?: ProductLine;
  /** Products that insure this family. */
  insured_family?: InsuredFamily;
  /**
   * Products that insure this kind of `insured_family`, for example "cat". A
   * product matches when its insured type of that family lists the kind, or
   * lists no kinds. Give it with `insured_family`.
   */
  insured_kind?: string;
  /** Language of the text in the result: names, summaries, conditions and documents. */
  language?: LanguageTag;
  cursor?: string;
}

export interface ListProductsResult {
  products: Product[];
  next_cursor?: string;
}

/* ========================================================================== */
/* 5. Quote (level 2)                                                         */
/* ========================================================================== */

/**
 * A JSON Schema (2020-12) object that describes the questions of a product.
 * Each property is one question. Each property SHOULD have a `description` in
 * plain words, so that the agent can ask the question.
 *
 * A question MUST NOT ask for an identity number, a bank account or card
 * number, a tax number, health data of a person or a password. The seller asks for them on
 * its own page: the approval page of `submit_application`, or the
 * `handoff_url` of an offer.
 */
export interface AnswersSchema {
  type: "object";
  properties: { [key: string]: { [keyword: string]: unknown } };
  required?: string[];
  [keyword: string]: unknown;
}

/** Answers keyed by property name in `answers_schema`. */
export interface Answers {
  [key: string]: unknown;
}

/** Who produced the value of an answer. */
export type AnswerOrigin =
  /** The customer gave the value. */
  | "customer"
  /** The agent produced the value, for example from a photo or from earlier messages. */
  | "agent"
  /** A third party gave the value, for example a vehicle register or the previous insurer. */
  | "third_party";

/**
 * Where one answer comes from. `validated_by_customer` is true when the
 * customer confirmed this value before the agent sent it. It is always true
 * when the customer gave the value. An agent MUST NOT set
 * `validated_by_customer` to true when the customer did not validate that answer.
 */
export type AnswerSource =
  | { origin: "customer"; validated_by_customer: true }
  | { origin: "agent"; validated_by_customer: boolean }
  | {
      origin: "third_party";
      validated_by_customer: boolean;
      /** The third party, by its kind and country, for example "vehicle register (FR)". */
      source_name: string;
    };

/**
 * The source of each answer, keyed like `answers`. An agent MUST give a source
 * for each answer, and no source for a key that has no answer. Otherwise the
 * server returns `answers_invalid`.
 */
export interface AnswerSources {
  [key: string]: AnswerSource;
}

/**
 * Params of `quote`.
 *
 * The agent sends the answers that it has, even none. When answers are
 * missing, the server returns `needs_input` with the questions of the product
 * and the missing fields. The agent asks the customer, and calls `quote` again
 * with all the answers. This one loop replaces the tools that give the
 * questions, and the multi-step flow tools (`action`, `stateUpdates`,
 * `sessionId`) that most servers use.
 *
 * The server keeps the answers and their sources with each offer, until its
 * `valid_until`. `submit_application` takes them from the offer, so the agent
 * does not send them again.
 */
export interface QuoteParams {
  product_id: string;
  /** The answers that the agent has. Empty in a first call that has none. */
  answers: Answers;
  /** Where each answer comes from, keyed like `answers`. */
  answer_sources: AnswerSources;
  /** Options the customer wants priced, by key (optional covers, extra services). */
  options?: string[];
  language?: LanguageTag;
}

export interface FieldIssue {
  field: string;
  issue: "missing" | "invalid" | "not_accepted";
  message?: string;
}

/**
 * One priced offer. A seller can return several offers: one per tier, per
 * provider, or per duration. Each offer prices one tier of its product. Its
 * price can change after the insurer's checks. The firm price is the one that
 * the approval page shows.
 *
 * When a server implements `quote`, an agent MUST take the price, the cover,
 * the limits and the excess that it shows the customer from the offer, and
 * MUST NOT take them from a page made for people.
 */
export interface Offer {
  offer_id: string;
  product_id: string;
  /**
   * The `key` of the tier of the product that this offer prices. The cover of
   * its pricing is the cover of that tier for this customer.
   */
  tier: string;
  provider: ProviderRef;
  /**
   * The price and the cover. A server SHOULD give `cover.excess`,
   * `cover.limits` and `fees`. An empty `limits` means that the cover has no
   * limit.
   */
  pricing: Pricing;
  /** Last moment the customer can apply for the offer. */
  valid_until: DateTimeString;
  /**
   * Page where the customer continues with this exact offer on the seller's
   * site. A server at level 2 MUST give it, because it takes no application.
   * It MUST be on the domain of the seller or of the provider, and MUST NOT
   * contain personal data.
   */
  handoff_url?: Url;
  /**
   * The documents of this offer. A server SHOULD list every document that the
   * customer must receive before they commit.
   */
  documents?: InsuranceDocument[];
}

/** A quote with its priced offers, or with the reason why there is none. */
export interface QuoteComplete {
  status: "complete";
  offers: Offer[];
  /** Required when `offers` is empty. */
  no_offer?: NoOffer;
}

/** The questions of the product, and the answers that are still missing or wrong. */
export interface QuoteNeedsInput {
  status: "needs_input";
  /** The questions of the product. The agent asks the missing ones from it. */
  answers_schema: AnswersSchema;
  /** Properties of `answers_schema` that are missing, not valid or not accepted. */
  missing_fields: FieldIssue[];
}

export type QuoteResult = QuoteComplete | QuoteNeedsInput;

/** Why no offer is possible. */
export interface NoOffer {
  reason_code: NoOfferReason;
  /** Plain-language explanation the agent can pass to the customer. */
  message: string;
}

/**
 * Stable reason why no offer is possible. Servers SHOULD use a value of
 * `KnownNoOfferReason`. Other values MUST be lower case with underscores.
 * @pattern ^[a-z][a-z0-9_]*$
 */
export type NoOfferReason = string;

/**
 * Common reason codes. `outside_underwriting_scope` means that the risk is
 * outside the product's underwriting scope: its geography, its insured types or
 * its conditions. A quote for a risk outside the structured part MUST get this
 * reason.
 */
export type KnownNoOfferReason =
  /** The risk is outside the product's underwriting scope. */
  | "outside_underwriting_scope"
  /** The insurer does not accept the risk, and gives no more precise reason. */
  | "risk_not_accepted"
  /** The age of the insured person or animal is outside the insurer's limits. */
  | "age_not_accepted"
  | "breed_not_accepted"
  | "claims_history_not_accepted";

/* ========================================================================== */
/* 6. Premium and cover                                                       */
/* ========================================================================== */

export type PremiumPeriod = "month" | "quarter" | "half_year" | "year" | "single";

export interface Premium {
  amount: Money;
  period: PremiumPeriod;
  /** True when taxes and mandatory levies are in `amount`. */
  taxes_included: boolean;
}

export interface CoverLimit {
  /** Stable key, for example "vet_costs_per_year". */
  key: string;
  label: string;
  limit?: Money;
  /** Share of a claim paid back, from 0 to 1. Used by pet and health cover. */
  reimbursement_rate?: number;
}

/** What one excess applies to. */
export type ExcessBasis =
  /** Each claim. */
  | "per_claim"
  /** The claims of one year of cover, together. */
  | "per_year"
  /** The claims for one condition, for example one illness of a pet. */
  | "per_condition";

export interface CoverSummary {
  /** Covers included, as short labels. */
  included: string[];
  limits?: CoverLimit[];
  excess?: Money;
  /** What the excess applies to. Required when `excess` is above zero. */
  excess_basis?: ExcessBasis;
  /** Main exclusions. The full list is in the documents. */
  main_exclusions?: string[];
  /**
   * The waiting period of each cover. Each `applies_to` MUST be a label of
   * `included`. Give 0 days for a cover that starts at once, so that the wait
   * of an illness does not read as the wait of an accident.
   */
  waiting_periods?: WaitingPeriod[];
}

/** The days after the start date before a claim for one cover is paid. */
export interface WaitingPeriod {
  /** The cover it applies to: a label of `included`, for example "Illness". */
  applies_to: string;
  /** Days after the start date. 0 when the cover starts at once. */
  days: number;
}

/** A fee that the customer pays on top of the premium, for example a policy fee or a broker fee. */
export interface Fee {
  /** Stable key, for example "policy_fee". */
  key: string;
  label: string;
  amount: Money;
  /** How often the customer pays it. `single` for a fee paid once. */
  period: PremiumPeriod;
}

/** An option the customer can add (optional cover, extra service). */
export interface ProductOption {
  key: string;
  label: string;
  /** Cost of the option, in the same form as the main price. */
  price?: Premium | Money;
}

/** The price of an offer, and the cover it buys. */
export interface Pricing {
  premium: Premium;
  /** Fees on top of the premium. An empty list means that the customer pays no fee. */
  fees?: Fee[];
  cover: CoverSummary;
  /** The options in this price, from the `options` of the quote. */
  options?: ProductOption[];
}

/* ========================================================================== */
/* 7. Applications (level 3)                                                  */
/* ========================================================================== */

/** Role of a party in the application. */
export type PartyRole = "subscriber" | "payer" | "insured" | "beneficiary";

/**
 * A person or organisation in the application. Data in a party MUST be limited
 * to what the product needs. Identity numbers MUST NOT be here.
 */
export interface Party {
  /** Local reference, unique in one application. */
  party_ref: string;
  kind: "person" | "organisation";
  roles: PartyRole[];
  display_name: string;
  /** Relationship to the subscriber, for example "self", "spouse", "child", "employee". */
  relationship_to_subscriber?: string;
  date_of_birth?: DateString;
  country_of_residence?: CountryCode;
}

/**
 * Params of `submit_application`. The offer comes from a complete quote. The
 * server takes the answers, their sources and the options from that quote, so
 * the agent does not send them again. When the customer wants to change an
 * answer, the agent calls `quote` again, and applies for an offer of the new
 * quote.
 */
export interface SubmitApplicationParams {
  offer_id: string;
  parties: Party[];
  /** Language of the `summary` and of the approval page. */
  language?: LanguageTag;
}

/**
 * An application that waits for the customer. `submit_application` commits
 * nothing. The customer approves the application on the seller's page at
 * `url`, then signs and pays on the same site. When the client declares MCP
 * URL-mode elicitation, the server SHOULD open the page with a URL-mode
 * elicitation of `url`. Otherwise the agent gives the customer `url`.
 *
 * The seller MUST keep what the customer approved, with the answers and their
 * sources, the price and the documents, for the period that the law requires.
 */
export interface SubmitApplicationResult {
  application_id: string;
  /** The key to read the application with `get_operation`. See `ApplicationKey`. */
  application_key: ApplicationKey;
  /**
   * The application in plain words, so that the customer can decide from it
   * alone: the product, the tier, the insurer and the price. It MUST give each
   * answer and its source, and MUST ask the customer to approve only when each
   * answer is true and complete, so that the approval is also the customer's
   * confirmation of the answers.
   */
  summary: string;
  /**
   * The seller's page where the customer approves the application, then signs
   * and pays. Before the customer can approve, the page MUST show the firm
   * price, each answer with its source, and a link to each document of the
   * product and of the offer with `required_before_commitment: true`. It MUST
   * let the customer approve or refuse.
   *
   * The page MUST take an approval only from a form that the person submits on
   * it, never from a GET request, so that a link preview cannot approve. The
   * URL MUST be on the domain of the seller, MUST hold a token of at least 128
   * bits of randomness that is neither the `application_id` nor the
   * `application_key`, and MUST NOT contain personal data.
   */
  url: Url;
  /** Last moment the customer can approve. After it, the application is `expired`. */
  expires_at: DateTimeString;
}

/**
 * The key to read an application with `get_operation`. The server returns it
 * only in the result of `submit_application`. It MUST hold at least 128 bits
 * of randomness. It is not in the approval page, so the agent keeps it to
 * itself.
 * @minLength 22
 */
export type ApplicationKey = string;

/** Where an application is. */
export type ApplicationState =
  /** The customer has not approved or refused yet. */
  | "waiting"
  /** The customer approved. They sign and pay on the seller's site. */
  | "approved"
  /** The customer refused, or the insurer refused after its checks. */
  | "refused"
  /** The customer did not approve before `expires_at`. */
  | "expired";

/** Params of `get_operation`. */
export interface GetOperationParams {
  application_id: string;
  application_key: ApplicationKey;
}

/**
 * Result of `get_operation`. When the `application_key` is not the key of the
 * application, the server returns `application_not_found`.
 */
export interface GetOperationResult {
  application_id: string;
  state: ApplicationState;
}

/* ========================================================================== */
/* 8. Errors                                                                  */
/* ========================================================================== */

export type AipErrorCode =
  /** A param is missing, is not valid, or conflicts with another one. `fields` lists each one. */
  | "invalid_params"
  /** The agent sent too many calls. It can retry after `retry_after_seconds`. */
  | "rate_limited"
  /** The server, or a system behind it such as the insurer's, does not answer. A later call can succeed. */
  | "unavailable"
  /** The server does not implement this tool, because the tool is above its declared level. */
  | "not_supported"
  /** The seller holds no licence for this country, subdivision or line. */
  | "not_licensed"
  /** No product has this `product_id`. */
  | "product_not_found"
  /** An answer has no source, or a source has no answer. `fields` lists each one. */
  | "answers_invalid"
  /** No offer has this `offer_id`. */
  | "offer_not_found"
  /** The offer is past its `valid_until`. */
  | "offer_expired"
  /** No application has this `application_id` with this `application_key`. */
  | "application_not_found";

/**
 * Error returned in an MCP tool result with `isError: true`, in
 * `structuredContent.error`, with the same JSON as text in `content`.
 */
export interface AipError {
  code: AipErrorCode;
  message: string;
  fields?: FieldIssue[];
  /** True when the same call can succeed later with no change, as for `rate_limited` and `unavailable`. */
  retryable: boolean;
  /** When the agent SHOULD retry, when `retryable` is true. */
  retry_after_seconds?: number;
}

/* ========================================================================== */
/* 9. Tool index                                                              */
/* ========================================================================== */

export const TOOL_NAMES = {
  get_distributor: "get_distributor",
  list_products: "list_products",
  quote: "quote",
  submit_application: "submit_application",
  get_operation: "get_operation",
} as const;

export type ToolName = keyof typeof TOOL_NAMES;

/**
 * Level, MCP annotation and description of each tool. The description is the
 * text that a server SHOULD give the tool in MCP `tools/list`, so that every
 * agent reads the same words.
 */
export const TOOLS: {
  [K in ToolName]: {
    level: ConformanceLevel;
    readOnlyHint: boolean;
    description: string;
  };
} = {
  get_distributor: {
    level: 1,
    readOnlyHint: true,
    description:
      "Who sells: the legal name, the domain, the licences and the AIP settings of this seller. The licences are a claim. Check them with the AIP registry.",
  },
  list_products: {
    level: 1,
    readOnlyHint: true,
    description:
      "The products, each with its underwriting scope, its tiers and its documents, and no price. Filter by country, subdivision, line, insured family and kind. Read the conditions of the scope before you ask the customer any question.",
  },
  quote: {
    level: 2,
    readOnlyHint: true,
    description:
      "Price a product. Send all the answers you have, each with its source, even none. When answers are missing, the result gives the questions as a JSON Schema and the missing answers. Otherwise it gives the offers, or the reason for no offer. The price of an offer can change after the insurer's checks.",
  },
  submit_application: {
    level: 3,
    readOnlyHint: false,
    description:
      "Apply for an offer of a complete quote. The server takes the answers and their sources from that quote. Returns the page where the customer checks the answers, reads the documents and approves, then signs and pays. Only the customer can approve.",
  },
  get_operation: {
    level: 3,
    readOnlyHint: true,
    description:
      "Read where an application of this server is: waiting for the customer, approved, refused or expired. Send the application_id and the application_key of submit_application.",
  },
};

/** Errors that any tool can return. A tool that the server does not implement returns `not_supported`. */
export const COMMON_ERRORS: AipErrorCode[] = ["invalid_params", "rate_limited", "unavailable", "not_supported"];

/** The errors of each tool, besides `COMMON_ERRORS`. A server MUST NOT return another code. */
export const TOOL_ERRORS: { [K in ToolName]: AipErrorCode[] } = {
  get_distributor: [],
  list_products: [],
  quote: ["product_not_found", "not_licensed", "answers_invalid"],
  submit_application: ["offer_not_found", "offer_expired", "not_licensed"],
  get_operation: ["application_not_found"],
};

/** Params and result type of each tool. */
export interface ToolSignatures {
  get_distributor: { params: GetDistributorParams; result: GetDistributorResult };
  list_products: { params: ListProductsParams; result: ListProductsResult };
  quote: { params: QuoteParams; result: QuoteResult };
  submit_application: { params: SubmitApplicationParams; result: SubmitApplicationResult };
  get_operation: { params: GetOperationParams; result: GetOperationResult };
}
