# The AIP skill

The skill `agentic-insurance-protocol` tells an AI agent how to buy insurance for a customer under the Agentic Insurance Protocol (AIP). Any assistant that loads skills in the [Agent Skills format](https://agentskills.io/specification) can install it. The skill uses the AIP registry and the MCP server of each seller, and it follows the rules of the customer's country.

The skill is open source, under the Apache 2.0 licence of this repository. The AIP maintainers wrote the first draft. The goal is that the industry agrees on it, and that the regulator of each country owns the rules of its country.

The docs give the install steps, who the skill is for, and how a regulator takes over the file of its country: see the [page of the AIP skill](https://docs.agenticinsuranceprotocol.org/0.1/skill).

## What the agent does

Before it sends any of the customer's answers, the agent checks the seller's licence in the public register of the country, through the registry. It reads the underwriting scope of each product and drops the products that cannot cover the customer. It asks the questions of the seller, and it gives a source for each answer: the customer, the agent, or a named third party. The agent shows the full offer in the seller's words, with the cover, the limits and the excess, and checks the insurer before it applies. The customer approves the application on the seller's page: they read the pre-contract documents, check each answer and its source, and approve, then sign and pay there. The agent never approves for them, and it keeps the evidence.

The full procedure is in [agentic-insurance-protocol/guidelines.md](agentic-insurance-protocol/guidelines.md).

## How the skill is built

SKILL.md stays under 30 lines: where to start, and the countries that have rules. Everything else is one file away, so an agent reads only what its sale needs.

```
agentic-insurance-protocol/
  SKILL.md                   Start here, and the supported countries
  guidelines.md              How it works: the checklist, the six steps, the Never list
  references/
    tools.md                 Each registry and seller tool: params, results, errors
    evidence.md              What the agent keeps, and the customer's copy
    countries/
      fr/country.md          The rules of France
      gb/country.md          The rules of the United Kingdom
      us/country.md          What the US states share
      us/lines/pet.md        US rules for pet insurance only
  evals/evals.json           Test cases of the evaluation, each with the rules it tests
rules-map.md                 Each rule for the agent and its source, for regulators
```

A country folder splits by what applies to the customer: `country.md` for the country, `states/<code>.md` for a state or a region, `lines/<line>.md` for one line of insurance. For a cat in Texas, the agent reads `us/country.md` and `us/lines/pet.md`. The registry's `get_country_rules` returns the same files in the same order.

## Countries at launch

At launch, the skill supports three countries: the United States, the United Kingdom and France. They show the logic on three legal systems: state law built on the NAIC model acts, the rules of the FCA, and EU law as France applies it. The agent follows the rules of the country where the customer lives, and of the country where the insured good is, whatever the seller's country. Outside the three countries, it stops. A new country needs its public registers in the registry and one folder in the skill.

| Country | Files | Version | Status | Owner |
|---|---|---|---|---|
| United States | `us/country.md`, `us/lines/pet.md` | 0.1.0 | Draft, not reviewed | AIP maintainers |
| United Kingdom | `gb/country.md` | 0.1.0 | Draft, not reviewed | AIP maintainers |
| France | `fr/country.md` | 0.1.0 | Draft, not reviewed | AIP maintainers |

Each file starts with a YAML front matter: `country`, `version`, `owner`, `status`, `language`, `effective_from` and `sources`, then `subdivision` or `line` for a file of a state or a line, and `endorsed_by` and `reviewed_at` when they apply. A country file covers who may sell, what the agent may say, the documents before commitment, the demands and needs, the withdrawal period, sensitive data and complaints. Each legal statement gives its source, and the mark "Not reviewed" until a lawyer or the regulator checks it.

The registry serves the same files through `get_country_rules`, with the same text. The agent loads the live file first, and uses its bundled copy only when the registry does not answer.

## Change a file

Open an issue or a pull request. Each legal statement needs a source. In draft 0.1, each file stays at version 0.1.0. From the next draft, any change in the text of a file changes its version.

## The seller skill

`install-aip-seller-mcp` is a second skill, for sellers. Its `template/` is a small Express app with an MCP server and the five seller tools as shells. An insurer, a broker or an MGA starts from it in Claude Code and fills each tool with its own data.

```bash
npx skills add Agentic-Insurance-Foundation/agentic-insurance-protocol --skill install-aip-seller-mcp
```

You can also tell your AI agent to install the skill and follow it:

```text
Install the AIP seller MCP server from docs.agenticinsuranceprotocol.org/install.md
```
