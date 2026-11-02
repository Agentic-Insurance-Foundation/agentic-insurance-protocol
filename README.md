# Agentic Insurance Protocol (AIP)

AIP defines how an AI agent finds, prices and applies for an insurance product with any seller. The seller keeps the source of each answer, and the customer approves each application on the seller's own page, so that a sale through an AI agent meets the same rules as a sale on the seller's site.

Draft 0.1 covers the sale only. Servicing after the sale comes in a later draft.

AIP is an extension of MCP, which carries every call. It needs no other protocol, and it defines only what is specific to insurance.

Status: **draft 0.1**. A later draft can break this one until 1.0.

Countries: draft 0.1 supports three countries at launch, the United States, the United Kingdom and France. They show the logic on three legal systems. The rules of the customer's country apply, where the customer lives and where the insured good is, whatever the seller's country. The tools and the types do not depend on a country, so a new country needs only its public registers in the registry and its rules file in the skill. Until then, the AI agent tells the customer that AIP does not support that country yet.

## Why

AI agents now open insurers' websites, fill in the forms and get quotes for people. Insurance is a regulated market. In each country, a regulator decides who may sell, who may advise, which documents the customer reads before they commit and what they must confirm. No rule applies yet to an AI agent that buys insurance, so each insurer answers alone. It can block AI agents, let them in with no rules, or write its own rules. None of these works in a regulated market, because a seller cannot choose the law of its own sales. We think one set of rules should apply to the whole market, and that the regulator of each country should own it. AIP is a first version of these rules, for the market to agree on and for the regulators to take over.

One AI agent serves people in every country, and it can reach a seller's website in any country. It must follow the law of the customer's country, whatever the seller's country. Each seller also exposes a different shape. The MCP servers we looked at for this draft quote with different tool names, different inputs and different flows. An agent cannot compare two offers or do the same action twice in the same way.

MCP does not cover what insurance regulation asks for:

- **Right to sell.** Who holds a licence, from which regulator, in which role. This covers the insurer that carries the risk too.
- **Underwriting scope.** Which risks a product can cover, published before any question, so that an agent does not buy cover that cannot apply to the customer.
- **Pre-contract information.** The IPID and the general conditions must reach the customer before they commit.
- **Demands and needs.** The seller records them before the contract (IDD art. 20 in France, ICOBS 5.2 in the United Kingdom) and says if it gave advice.
- **Declaration.** The answers the customer commits to, with the exact questions they answered, where each answer came from, and the customer's approval.
- **Parties.** Subscriber, insured, beneficiary and payer can be different people.
- **Withdrawal period** after a distance sale.

## Where to start

| You are | Start with |
|---|---|
| A seller or an insurer with an MCP server | The specification, [`docs/0.1/spec.mdx`](docs/0.1/spec.mdx), then the types in [`spec/schema.ts`](spec/schema.ts) |
| A seller that builds its MCP server | The skill and the template in [`skills/install-aip-seller-mcp/`](skills/install-aip-seller-mcp/). Or tell your AI agent: "Install the AIP seller MCP server from docs.agenticinsuranceprotocol.org/install.md" |
| A maker of an AI assistant | The AIP skill in [`skills/`](skills/) |
| A regulator | The rules of your country in [`skills/agentic-insurance-protocol/references/countries/`](skills/agentic-insurance-protocol/references/countries/) |
| The operator of a registry | [`docs/0.1/registry.mdx`](docs/0.1/registry.mdx), then [`registry/src/schema.ts`](registry/src/schema.ts) |

## Files

| Folder | What it holds |
|---|---|
| `spec/` | The protocol: the types, the schemas and the worked example |
| `docs/` | The docs, a Mintlify site: the specification, the registry, the evaluation and the worked example in MDX, and the pages and tables that `scripts/docs.ts` generates. See [AGENTS.md](AGENTS.md#docs) |
| `skills/` | The AIP skill: a short SKILL.md, the guidelines that a buying agent follows, and one rules folder per country. See [skills/README.md](skills/README.md). Also `install-aip-seller-mcp`, the skill that builds the MCP server of a seller from its template |
| `scripts/` | Generate the schema, the tool definitions and the generated parts of the docs, build the examples, run the checks |
| `website/` | The website at [agenticinsuranceprotocol.org](https://agenticinsuranceprotocol.org), a Next.js app. See [website/AGENTS.md](website/AGENTS.md) |
| `registry/` | The AIP registry, the MCP server at `registry.agenticinsuranceprotocol.org`. It lists no server and reads no register yet. See [registry/README.md](registry/README.md) |

In `spec/`:

| File | What it is |
|---|---|
| `schema.ts` | Source of truth. Every type, with the rules in RFC 2119 keywords |
| `registry.ts` | The types, the tools and the rules of the registry. The registry server defines them in [`registry/src/schema.ts`](registry/src/schema.ts), and this file exports them again |
| `schema.json` | JSON Schema generated from `schema.ts` and `registry/src/schema.ts`. Do not edit it by hand |
| `tools.json` | The MCP definition of each tool: its description, its input and output schemas, its annotations. Generated with `schema.json` |
| `examples/` | A worked pet insurance flow with fictional data: find the product with its scope, its tiers and its documents, quote a cat from the answers of the chat, get the open questions, quote with every answer, quote an older dog and a pet outside the scope that get no offer, apply, approve on the seller's page, and read the application. The `registry-` files show the rules of France, the rules of pet insurance in Texas, a search with its licence check, three seller checks and an insurer check |

Run `bun install`, then `bun run check`. It type-checks the schema, the scripts, the website, the registry and the seller template, so each example must match its schema type. Then it generates `schema.json`, `tools.json`, the files that the registry takes from the spec and the generated parts of the docs, rebuilds the examples, validates them, runs the rule checks, and checks the docs with the Mintlify CLI. CI runs the same command on every push. `website/`, `registry/` and `skills/install-aip-seller-mcp/template/` are workspaces of the root package, so the same `bun install` installs all three. `bun run dev` previews the website, and `bun run build` builds it. `bun run docs` previews the docs at http://localhost:3000.

## What insurance law asks for

A sale through an AI agent must leave the same record as a sale on the seller's own site. `schema.ts` gives a type to what insurance law asks for, and the seller's page does the rest.

| Topic | Draft 0.1 |
|---|---|
| Pre-contract documents | IPID, general conditions, each marked when the law requires it before commitment |
| Demands and needs | On the seller's page, before the customer approves |
| Underwriting scope | Geography, insured types, conditions in plain words |
| Declaration | Answers, the source of each answer, the customer's approval |
| Pricing | Premium, taxes included or not, fees, cover, limits, excess and its basis |
| Application | The customer approves once on the seller's page, then signs and pays there. The seller keeps what they approved |

## Conformance levels

| Level | Tools |
|---|---|
| 1. Inform | `get_distributor`, `list_products` |
| 2. Quote | + `quote`. Each offer has a `handoff_url` to the seller's site |
| 3. Subscribe | + `submit_application`, `get_operation`. The customer approves the application on the seller's page |

A server declares its level and its lines under `capabilities.extensions["org.agenticinsuranceprotocol/aip"]` in MCP `server/discover` and in its `/.well-known/aip.json`. A client ignores the fields of a result that it does not know.

## Registry

One central MCP server helps a buying agent before it calls any seller. `search_distributors` finds the sellers that speak AIP in a country. `verify_licence` checks a seller, or the insurer behind an offer, in the public registers, and gives a verdict: `licensed`, `not_licensed` or `unknown`. `get_country_rules` returns the rules of a country for the AIP skill. The registry needs no customer data and no session. Each server in a search comes with a licence check for the market asked, so an agent needs no second call for a listed seller. `verify_licence` works for a seller that the registry does not list, because an agent can find a seller anywhere on the web.

The registry lists a server only when the server proves its domain with `/.well-known/aip.json`, holds an active licence in a public register, and has every tool of its level. A seller asks at the `listing_url` of the registry, the form of the [`/submit`](https://agenticinsuranceprotocol.org/submit) page for now, with its website and its MCP server or `aip.json`. The operator checks each step, and answers listed, on hold or refused, with each step that did not pass. The operator reads the registers and adds no judgement of its own, and the regulators can take it over country by country. [`docs/0.1/registry.mdx`](docs/0.1/registry.mdx) gives the rules and the public registers of the United States, the United Kingdom and France. Checks RG1 to RG10 cover its rules.

At launch, with no data agreement, a registry can check the insurers of France and of the EEA, the agents and agencies of Texas, and the legal identity of any company through its LEI. The intermediaries of the three countries and the insurers of the United States need an agreement with NIPR, the FCA, ORIAS and the NAIC. Until then, a check of such a seller returns `unknown`, and an agent that follows the skill does not send it the customer's answers.

## The skill

The AIP skill, `agentic-insurance-protocol` in [`skills/`](skills/), tells a buying agent how to use the registry and the seller's tools, in order. It is in the [Agent Skills format](https://agentskills.io/specification), so any assistant that loads skills can install it. SKILL.md stays under 30 lines: where to start, and the three countries. `guidelines.md` holds the checklist and the steps, and each country has a folder of rules. The procedure has six steps, and the customer acts in three of them. Before it sends any answer, the agent checks the seller and the insurer. It keeps only the products whose underwriting scope fits the customer. Each answer gets a source. The agent shows the full offer in the seller's words, and the customer approves the application once, on the seller's page, with the answers, their sources, the firm price and the documents. The agent keeps the evidence at every step. The skill holds every rule for the agent of the specification and of the registry, and `skills/rules-map.md` gives the source of each one.

To install the skill in Claude Code, Codex, Cursor or another AI agent, run:

```bash
npx skills add Agentic-Insurance-Foundation/agentic-insurance-protocol --skill agentic-insurance-protocol
```

Then connect the AI agent to the AIP registry, an MCP server at `https://registry.agenticinsuranceprotocol.org/mcp`. The [page of the AIP skill](https://docs.agenticinsuranceprotocol.org/0.1/skill#install) gives the command for Claude Code. You can also tell your AI agent: "Install the AIP registry from docs.agenticinsuranceprotocol.org/install.md".

Each country folder holds `country.md`, and files for one state in `states/` or one line in `lines/`, for example the US rules for pet insurance. Each legal statement gives its source and stays "Not reviewed" until a lawyer or the regulator checks it. The registry serves the same files through `get_country_rules`, with the same text, so that a regulator can take over the file of its country and every agent gets the change on its next call. The test cases of the evaluation, at least one for each risk, are in `skills/agentic-insurance-protocol/evals/evals.json`. Checks SK1 to SK4 cover the format of the skill.

## Evaluation

The evaluation tests that an AI agent with the skill follows the rules of each country. The AI agent goes through the test cases of `evals.json`, with a test registry, test sellers and a test customer, and gets a score for each country. Each case names the rules it tests: a section of a specification, such as "AIP 9.2", or a rule of a country file, such as "fr/country.md: What you may say, 2". The regulator that owns a country file owns the test cases of its rules, and sets the score that an AI agent must reach there. An AI agent that does not reach it does not buy insurance through AIP in that country. Each new version of the model, of the skill or of a rules file is tested again. [`docs/0.1/evaluation.mdx`](docs/0.1/evaluation.mdx) gives the details, and check SK5 covers the format of the test cases. The test bench, the grader and the required scores are not built yet.

## Design choices

**One `quote` loop.** Most of the servers we looked at use a tool that gives the questions, then multi-step flow tools (`action`, `stateUpdates`, `sessionId`). `quote` accepts the answers that the agent has, even none, and returns `needs_input` with the questions as a JSON Schema and the missing fields. Some of those servers already work this way. MCP form elicitation could ask the customer instead, but the agent often has the answer already, from the conversation or a photo, and form elicitation takes only flat fields. The loop lets the agent answer, with a source for each answer.

**Tiers before the price.** A product lists its tiers, for example Bronze, Silver and Gold, each with its cover, as the seller's own site does. `list_products` gives no price, because the price depends on the customer's answers.

**A list of offers, or a reason.** A quote returns one offer per tier or provider, and each offer names the tier that it prices. When there is none, it returns a `no_offer` reason code, for example when the insurer does not accept the pet's age.

**The underwriting scope comes before the questions.** Each product publishes the countries and subdivisions it covers, what it insures (a family such as `pet` or `dwelling`, and its kinds), and the other conditions in plain words. The geography and the insured types are mandatory and structured, so an agent drops a product that cannot cover the customer before it asks a question, and `quote` refuses a risk outside them with `outside_underwriting_scope`. Conditions such as "Not for people over 70" stay in plain words, because a fixed list cannot hold them all. The agent checks them with the customer. The scope lives on the insurer's server. A registry does not copy it.

**Each answer keeps its source.** An answer comes from the customer, from the agent, or from a named third party, and says whether the customer validated it. The sources go with the answers to `quote` and stay with each offer, and the approval page shows them. When an answer turns out to be false, the record shows who produced it.

**One approval, on the seller's page.** A price from `quote` can change after the insurer's checks, and needs no approval. `submit_application` takes the answers and their sources from the offer, and returns the address of a page where only the customer can approve. The server opens it with MCP URL-mode elicitation, or the agent links to it, so it works with the hosts of today. On that page, the customer reads the documents, checks each answer with its source and the firm price, and approves once. That approval is also the confirmation that the answers are true and complete. Then the same page takes the customer on to sign and pay, and the agent reads the state with `get_operation`. A flag in `quote` would leave the agent's word as the only evidence.

**The price comes from the tools.** A page made for people can leave out the excess or show the price of another profile. An agent takes the price, the fees, the cover, the limits and the excess from the offer, and the approval page shows the firm price.

**Sensitive values never pass through the agent.** No question asks for an identity number, a bank or card number, a tax number, health data of a person or a password. The customer gives them on the seller's own page, where they also approve, sign and pay.

**Open results.** A client ignores the fields of a result that it does not know, and `schema.json` leaves result objects open, so that a server can add a field without breaking a client. The params of the registry tools stay closed, because a field that the draft does not define could carry customer data.

**The seller keeps the record.** The seller keeps what the customer approved on its page: the price, the answers and their sources, and the documents, for the period that the law requires. The AI agent keeps a copy for the customer. Draft 0.1 leaves the form of that record to the seller.

## Rules the checks cover

`scripts/validate.ts` checks the rules that a JSON Schema cannot express. The docs list them: R1 to R16 for the seller tools in [section 14 of the specification](https://docs.agenticinsuranceprotocol.org/0.1/spec#14-checks), RG1 to RG10 for the registry in [section 13 of the registry](https://docs.agenticinsuranceprotocol.org/0.1/registry#13-checks), and SK1 to SK5 for the skill on the [page of the AIP skill](https://docs.agenticinsuranceprotocol.org/0.1/skill#checks).

## Open points

The questions that draft 0.1 leaves open are in [section 15 of the specification](https://docs.agenticinsuranceprotocol.org/0.1/spec#15-open-points).

## Related work

- [MCP](https://modelcontextprotocol.io/specification/latest) and its [extensions](https://modelcontextprotocol.io/extensions/overview)
- [PAP draft 0.2](https://personalagentprotocol.org/docs/0.2/spec), which identifies an AI agent to a business
- [AFSP](https://agenticfinanceprotocol.org/), which covers trust before a bank account opening. AIP covers the product, the offer and the evidence, so the two can work together.

## Feedback and contributions

The specification is a draft. To send feedback, open an [issue](https://github.com/Agentic-Insurance-Foundation/agentic-insurance-protocol/issues/new/choose). To change this repository, see [CONTRIBUTING.md](CONTRIBUTING.md). Report vulnerabilities privately, as [SECURITY.md](SECURITY.md) describes.

## Licence

The specification, the schema and the examples are licensed under the [Apache License 2.0](LICENSE).
