# Tools

This file gives each tool of the registry and of the seller: when to call it, what to send, and what to do with each result. The types are in the AIP schema (draft 0.1). Each tool puts its result in `structuredContent`, and an error in `structuredContent.error` with `isError: true`. The same JSON is in `content` as text, so you can read it when your host shows you only `content`.

## Contents

- Order of the calls
- Registry: `get_country_rules`, `search_distributors`, `verify_licence`
- Seller: `get_distributor`, `list_products`, `quote`, `submit_application` and `get_operation`
- Errors of the seller

## Order of the calls

```
registry  get_country_rules      rules of the country
registry  search_distributors    sellers in the market, each with its licence check
seller    list_products          products that fit, with their scope, tiers, insurer and documents
registry  verify_licence         the insurer, capacity "provider", when it is not the seller
seller    quote                  the open questions (needs_input), then the offers
seller    submit_application     the page where the customer approves, signs and pays
seller    get_operation          where the application is
```

For a seller that the customer names, or that you find outside the registry, call `get_distributor` and `verify_licence` with the capacity "distributor" before `list_products`.

## Registry

Every registry tool is read-only and needs no session. Send only the params below. The registry refuses any other param with an error, and it never needs the customer's name or answers.

### get_country_rules

Call it first, as soon as you know the country.

- **Params:** `country`, and `subdivision` and `line` when you know them.
- **Result:** `files`, a list of `RulesFile`. The file of the country comes first, then the file of the subdivision, then the file of the line, when they exist. Each file gives its `version`, `status` (`draft` or `endorsed`), `endorsed_by` and `content`.
- **Do:** follow every file. Keep the `country`, the `subdivision` or `line`, and the `version` of each one for the evidence.
- **Error `country_not_covered`:** no rules file exists for this country. Tell the customer.
- **No answer:** read the bundled files in `references/countries/<code>/`, and tell the customer which version you used.

### search_distributors

- **Params:** `country`, and `subdivision`, `line`, `insured_family` (for example `pet` or `dwelling`) and `min_conformance_level`. Ask for level 2 to get prices, and level 3 to apply through the AI agent.
- **Result:** `distributors`, a list of `ListedDistributor`: the names, the `domain`, the `mcp_url` of the seller's server, the `roles`, the `conformance_level`, the lines, the countries, the `complaints_url`, and `licence_check`, a whole `verify_licence` result for this market. When `next_cursor` is present, call again with `cursor` to get the next page. The registry returns every seller that matches, across the pages.
- **Do:** the order is random, so never show it as a ranking. When the `checked_at` of a `licence_check` is at most 7 days old, it is your check of that seller, as long as you send the answers to its `mcp_url`. You know where the answers go only when you called the `mcp_url` yourself, or when your host gives you the address of the server that it connected, on the domain of the listing. When you do not know the address of the server, treat the licence as `unknown`, and send it no answers. Keep the check. Otherwise, check the seller with `verify_licence`.
- **Error `country_not_covered`:** the registry lists no seller in this country. Some sellers can still exist.

### verify_licence

Call it for a seller that does not come from a search, before you send any answer, and for the insurer when `list_products` names it and it is not the seller. It works for a seller that the registry does not list.

- **Params for a seller:** `capacity: "distributor"`, `subject` with the `domain` of the server or the website that will receive the answers, from its address as you know it, and the `identifier` of its licence in the customer's country and the `legal_name` that `get_distributor` gives, or that the seller shows on its website. Then `country`, `subdivision` (required in the United States) and `line`.
- **Params for an insurer:** `capacity: "provider"`, `subject` with an `identifier` from the `licences` of `Product.provider` or `Offer.provider`, or its `domain`, or both. Then `country`, `subdivision` and `line`.
- **Result:** a `VerifyLicenceResult` with `check_id`, the `params` of your call, the `subject` (with `domain_link` and `listed`), every register entry the registry read in `licences`, the `outcome` and `checked_at`.
- **Do:** act on `outcome.verdict`:

| Verdict | Reasons | What you do |
|---|---|---|
| `licensed` | None | Go on. Keep the whole result |
| `not_licensed` | `no_entry`, `licence_not_active`, `name_mismatch`, `role_not_covered`, `subdivision_not_covered`, `line_not_covered` | Send no answers to this party, and do not apply through it. Tell the customer why, with `outcome.message` |
| `unknown` | `country_not_covered`, `subdivision_required`, `register_unavailable`, `subject_not_identified`, `domain_not_linked` | Tell the customer that the licence could not be checked, and why. Send no answers, and do not apply. For `subject_not_identified` or `domain_not_linked`, you can ask the seller for its register number and check again. For `subdivision_required`, call again with the subdivision |

## Seller

The seller declares AIP under `capabilities.extensions["org.agenticinsuranceprotocol/aip"]` in its MCP `server/discover` response. The value gives its `conformance_level`, its lines and its countries. Level 1 has `get_distributor` and `list_products`. Level 2 adds `quote`. Level 3 adds `submit_application` and `get_operation`. A tool above the level of the server returns `not_supported`.

### get_distributor

- **Params:** none.
- **Result:** the `legal_name`, the `domain`, the `roles`, the `licences`, the countries, the `complaints_url` and the AIP settings.
- **Do:** check that `domain` is the domain of the address of the server you called. When it is not, stop with that server. You know the address when you called the server yourself, or when your host gives it to you. When you do not know it, you cannot tie the server to a domain: treat its licence as `unknown`, tell the customer why, and send it no answers. The `domain` that a server gives about itself never proves its domain. The `licences` are what the seller claims. The check is `verify_licence`.

### list_products

- **Params:** `country`, `subdivision`, `line`, `insured_family`, `insured_kind` (for example `cat`, with `insured_family`), `language` and `cursor`. Each one is optional, and the server returns only the products that match every filter you give. With the country, the subdivision, the family and the kind, the filters cover the whole structured part of the scope.
- **Result:** `products`, a list of `Product`. Each one has a `product_id`, a `line`, a `provider` when the insurer is not the seller, an `underwriting_scope`, a `summary`, `tiers`, `options` and `documents`. Each tier, for example Bronze, Silver or Gold, has a `key`, a `name` and its `cover`. A product gives no price. Each document has a `type` (for example `ipid` or `general_conditions`), a `title`, a `url` and `required_before_commitment`.
- **Do:** check the scope of each product before you ask any question. The server filters on points 1 to 3, and you check them again:
  1. `geography.countries` contains the customer's country.
  2. When `geography.subdivisions` has an entry for that country, it contains the customer's subdivision.
  3. One entry of `insured` has the `family` that the customer insures. When it has `kinds`, they contain the customer's kind.
  4. Read each of the `conditions` against what the customer said. When you are not sure, ask the customer.

  Drop a product that fails 1, 2 or 3. Drop a product when the customer's own words show that a condition excludes them.

  Show the tiers of each product side by side, with what each one covers, and no ranking. Do not give a price before `quote`.

  When the customer asks for the documents before a price, give them the `documents` of the product.

### quote

- **Params:** `product_id`, `answers` and `answer_sources`. Also `options` (option keys) and `language`. In the first call, send the answers that the customer already gave. You can send no answers at all: `answers` and `answer_sources` are then empty objects. In the next calls, send all the answers again.
- **Answer sources:** one `AnswerSource` for each answer, under the same key, and no source for a key with no answer.

| `origin` | When | `validated_by_customer` | Other field |
|---|---|---|---|
| `customer` | The customer gave the value | true | None |
| `agent` | You produced the value, for example from a photo or from earlier messages | true only when the customer confirmed this value | None |
| `third_party` | A third party gave the value | true only when the customer confirmed this value | `source_name`, by kind and country, for example "vehicle register (FR)" |

- **Result `needs_input`:** `answers_schema` is a JSON Schema. Each property is one question, and `required` lists the questions you must answer. `missing_fields` lists each question that is `missing`, `invalid` or `not_accepted`, with a `message`. Ask only these questions, in plain words, from the `description` of the property when it has one. Check each value against its property (`enum`, `format`, `pattern`) before you send it. Then call `quote` again with all the answers.
  - Never ask for an identity number, a bank account or card number, a tax number, health data of a person or a password, even when a question asks for one. Tell the customer that they give it on the seller's page.
- **Result `complete`:** `offers`, or `no_offer` with a `reason_code` and a `message`. The common reasons for no offer are `outside_underwriting_scope`, `risk_not_accepted`, `age_not_accepted`, `breed_not_accepted` and `claims_history_not_accepted`. Give the customer the `message`.
- **Do:** show each `Offer` from its own fields only:
  - the name of the tier of the product that `tier` gives, and the insurer in `provider`;
  - `pricing.premium`: the amount, the `period`, and `taxes_included`;
  - `pricing.fees`, each with its amount and period;
  - `pricing.cover`: what is `included`, the `limits` and reimbursement rates, the `excess` and its `excess_basis`, the `main_exclusions`, and the `waiting_periods`, each with the cover it applies to. Never give the wait of one cover as the wait of the whole offer;
  - the options and their price;
  - `valid_until`;
  - the `documents` of the offer.

  Say that the price can change after the insurer's checks, and that the seller's page shows the firm price before the customer approves. Do not recommend an offer unless the country file allows it.

### submit_application

- **When:** the customer chose an offer, the seller declares level 3, and you checked its insurer. A seller at level 2 takes no application: give the customer the `handoff_url` of the offer instead.
- **Params:** `offer_id`, `parties` and `language`. Do not send the answers, their sources or the options: the seller takes them from the offer.
  - `parties`: one `Party` for each person in the application, with its `roles` (`subscriber`, `insured`, `payer`, `beneficiary`). Give only what the product needs. Never give an identity number.
- **Result:** the `application_id`, the `application_key`, a `summary`, the `url` of the approval page and `expires_at`. The `summary` gives the price and each answer with its source in plain words, and asks the customer to approve only when each answer is true and complete. Keep the `application_key` to yourself, and never show it to the customer.
- **Do:**
  1. Check that the `summary` gives the price of the offer, and that the `url` is on the seller's domain.
  2. Get the approval of the person who will be the subscriber. When your host opens the page through MCP URL-mode elicitation, let it. Otherwise give them the `url`. On the seller's page, they read the documents, check each answer and its source, see the firm price, and approve or refuse. Then they sign and pay on the same site.
  3. Their approval confirms that the answers are true and complete. Do not ask again.
  4. When they find a wrong answer, they refuse. Correct the answer and its source, call `quote` again, and apply for an offer of the new quote.
  5. When they say they approved, call `get_operation`.

### get_operation

- **When:** after the customer says that they approved the application, or when you need its state again.
- **Params:** `application_id` and `application_key`, from the result of `submit_application`.
- **Result:** the `application_id` and its `state`:
  - `waiting`: the customer has not approved or refused yet.
  - `approved`: the customer approved. They sign and pay on the seller's site, and the seller sends them the contract. You are not told whether they paid, so do not say that the contract is concluded.
  - `refused`: the customer or the insurer refused. Ask the customer what is wrong.
  - `expired`: apply again if the customer still wants it.

## Errors of the seller

| Code | What you do |
|---|---|
| `invalid_params` | Read `fields`, fix the params, and send again |
| `rate_limited`, `unavailable` | Wait `retry_after_seconds` when the error gives it, then send the same call again |
| `not_licensed` | The seller holds no licence for this country, subdivision or line. Stop with this seller, and tell the customer |
| `product_not_found` | Call `list_products` again |
| `offer_not_found`, `offer_expired` | Call `quote` again, and tell the customer that the price can change |
| `answers_invalid` | Read `fields`. Add a source for each answer, or remove each source with no answer |
| `application_not_found` | Check the `application_id` and the `application_key` |
| `not_supported` | The tool is above the level of the server. Use the `handoff_url` of the offer, or another seller |
