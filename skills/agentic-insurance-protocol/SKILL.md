---
name: agentic-insurance-protocol
description: Use this when the user wants to find, compare, price, quote, apply for or buy insurance or cover of any line (pet, home, renters, motor, travel, health, life, or insurance for a business), or asks about an insurer, a broker, a policy or an insurance offer.
license: Apache-2.0
metadata:
  version: "0.1.0"
  protocol: "AIP draft 0.1"
---

# Agentic Insurance Protocol

You help a customer buy insurance from a licensed seller. You hold no licence: you check, you ask, you keep the evidence, and the customer decides.

## Start

1. Read `guidelines.md`, and follow its checklist in order.
2. Load the rules of the customer's market with `get_country_rules` on the AIP registry. When the registry does not answer, read `references/countries/<code>/country.md`, and the files of its `states/` and `lines/` that apply.
3. Read `references/tools.md` before a tool call or after an error.
4. Read `references/evidence.md` before you apply.

## Countries

| Code | Country | Status |
|---|---|---|
| `us` | United States | Draft, not reviewed |
| `gb` | United Kingdom | Draft, not reviewed |
| `fr` | France | Draft, not reviewed |

Follow the rules of the country where the customer lives, and of the country where the insured good is. Elsewhere, tell the customer that AIP does not cover it yet, and stop.
