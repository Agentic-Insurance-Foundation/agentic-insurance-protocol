# Evidence

After a sale, the customer, the seller or a regulator can ask what happened: who sold, what the customer saw, what they declared and what they approved. The seller keeps what the customer approved on its page. You keep a copy for the customer, so that the customer can show what happened without the seller.

## What you keep

| What | Keep | From |
|---|---|---|
| The rules you followed | `country` and `version` of each rules file, and whether it came from the registry or from the bundled copy | `get_country_rules` |
| The seller | `legal_name`, `domain`, `licences` and `complaints_url` | `get_distributor`, or the listing of a search |
| The licence checks | The whole result of each check: `check_id`, `params`, `subject`, `licences`, `outcome` and `checked_at` | `verify_licence`, or the `licence_check` of a search |
| The product | `product_id`, each condition you checked, and what the customer said about it | `list_products` |
| The documents | `title`, `url`, and when you gave each one to the customer | The `documents` of the product and of the offer |
| The need | The customer's statement and its time | The conversation |
| The answers | Each answer and its source, as you sent them in each call | `quote` |
| The offers you showed | `offer_id`, `pricing`, `provider` and `valid_until` | `quote` |
| The application | `application_id`, `summary`, `expires_at`, and each state that you read | `submit_application` and `get_operation` |

Keep each item when you get it, and not only at the end. A customer who stops halfway still gets what you kept up to that point.

## What you never keep

- An identity number, a bank account or card number, a tax number, health data of a person or a password. They never pass through you.
- Data that the product does not need.

## Where you keep it

Keep the record with the conversation, in the storage that your host gives you. When your host keeps nothing after the conversation, give the whole record to the customer, and tell them that you keep no copy.

## What you give the customer

At the end, or when the customer stops, give them a summary in their language. Use this template, and leave out the lines that do not apply:

```
Your insurance with <seller trading name>

Seller: <legal_name> (<domain>)
  Licence check: <verdict>, <register> <identifier>, on <checked_at>. Check id <check_id>.
Insurer: <provider legal_name>
  Licence check: <verdict>, <register> <identifier>, on <checked_at>. Check id <check_id>.

Product: <product name>, <tier>
Price: <amount> <currency> per <period>, <taxes included | taxes not included>
Fees: <each fee, its amount and its period | none>
Cover: <included>
Limits: <each limit and reimbursement rate>
Excess: <excess>, <per claim | per year | per condition>
Main exclusions: <main_exclusions>
Waiting periods: <applies_to>: <days> days, for each cover

Documents:
  <title>, <url>

Your answers, and where each one came from:
  <question>: <answer> (<you said it | your assistant read it from ... | <source_name>>)
You confirmed these answers when you approved the application.

Application <application_id>: approved on the seller's page.
  You sign and pay on the seller's site, and the seller sends you the contract.

You can withdraw. <how and within how many days, from the country file>
To complain: <complaints_url>. Then: <the body that the country file names>.

Rules followed: AIP rules for <country>, version <version>.
```

When the customer asks, or when your host keeps nothing, also give the raw records as JSON.
