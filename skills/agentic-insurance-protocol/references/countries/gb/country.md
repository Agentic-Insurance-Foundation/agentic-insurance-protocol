---
country: GB
version: 0.1.0
owner: AIP maintainers
status: draft
language: en
effective_from: 2026-10-24
sources:
  - title: Financial Services and Markets Act 2000
    url: https://www.legislation.gov.uk/ukpga/2000/8/contents
  - title: Financial Services and Markets Act 2000 (Regulated Activities) Order 2001
    url: https://www.legislation.gov.uk/uksi/2001/544/contents
  - title: FCA Handbook, Perimeter Guidance manual (PERG 5)
    url: https://www.handbook.fca.org.uk/handbook/PERG/5/2.html
  - title: FCA Handbook, Insurance Conduct of Business sourcebook (ICOBS)
    url: https://www.handbook.fca.org.uk/handbook/ICOBS/6/1.html
  - title: FCA Handbook, Dispute Resolution (DISP)
    url: https://handbook.fca.org.uk/handbook/disp1/disp1s6
  - title: UK GDPR and Data Protection Act 2018
    url: https://www.legislation.gov.uk/ukpga/2018/12/schedule/1/paragraph/20
---

# United Kingdom

Draft. No lawyer and no regulator has reviewed this file. Each rule gives its source and its review status. Follow this file as well as the procedure of the skill.

## Who may sell

1. Only a firm that the FCA or the PRA authorises, or a person that the law exempts, may carry on a regulated activity in the United Kingdom. A breach is a criminal offence. Check the seller with `verify_licence`, the capacity "distributor" and the country GB, before you send any answer of the customer. Source: Financial Services and Markets Act 2000, s. 19 and s. 23. Not reviewed.
2. An appointed representative is exempt, and the FCA register lists it with the firm that is responsible for it. Source: Financial Services and Markets Act 2000, s. 39. Not reviewed.
3. An intermediary tells the customer, before the sale, that it is in the Financial Services Register and how to check it. Source: ICOBS 4.1.2R. Not reviewed.
4. Check the insurer behind each offer in the same way, with the capacity "provider". The Financial Services Register lists the insurers that the PRA authorises. Source: FCA, page on the Financial Services Register. Not reviewed.

## What you may say

1. Arranging a contract of insurance, helping the customer fill in an application, and buying a policy for the customer are regulated activities. They are carried on by way of business when the person gets a payment or another reward for them, money or not. Follow this skill only when you, and the company that runs you, get no commission, fee or other reward linked to the sale. Source: Regulated Activities Order 2001, art. 21 and 25; PERG 5.4.2G to 5.4.4G and PERG 5.15.4G. Not reviewed.
2. Do not recommend an offer, and do not advise the customer to take out or not to take out a policy. Recommending one policy over another is advice. When the customer asks for advice, say that you cannot give it, and that the seller can. Source: Regulated Activities Order 2001, art. 53(1); PERG 5.8.4G, 5.8.8G and 5.8.17G. Not reviewed.
3. Give the facts of each offer as `quote` returns them, side by side, with the same fields in the same order, so that the customer compares them alone. A neutral list of the policies that match the customer's facts need not be advice. Do not rank the offers. Source: PERG 5.8.17G. Not reviewed.
4. Give the cover in the seller's words, from the offer and the documents. Do not add your own reading of what a term means for the customer, because explaining or comparing the terms can be arranging. When the customer asks what a term means for them, send the question to the seller. Source: Regulated Activities Order 2001, art. 25(2); PERG 5.15.4G. Not reviewed.

## Documents before commitment

1. Before the customer commits, give them the IPID of each general insurance policy. It is the document with the type `ipid` and `required_before_commitment: true`. Source: ICOBS 6.1.5R and 6.1.10AR; ICOBS 6 Annex 3. Not reviewed.
2. Before the sale, the seller gives its identity, its address, whether it gives a personal recommendation, and its complaints procedure with the Financial Ombudsman Service. Take this from `get_distributor` and from the seller's documents, and give it to the customer. Source: ICOBS 4.1.2R. Not reviewed.
3. For a sale at a distance, the customer gets the distance marketing information, the law that applies, the complaints procedure and the right to cancel, before the conclusion. Give the customer each document that the seller marks `required_before_commitment: true`. Source: ICOBS 3.1.3R, 6.2.2R and 6.2.5R. Not reviewed.

## Demands and needs

1. Before the contract, the seller specifies the customer's demands and needs, gives the customer a statement of them, and proposes only a contract that is consistent with them. Record the customer's need in their own words in step 1 of the procedure. The seller gives its statement on its own page, before the customer approves. Source: ICOBS 5.2.2R, 5.2.2BR and 5.2.4G. Not reviewed.
2. When the seller gives a personal recommendation, tell the customer that it comes from the seller. You never give one. Source: ICOBS 5.3.1R and 5.3.4R. Not reviewed.

## Withdrawal

1. A consumer can cancel a general insurance contract or a distance contract within 14 days, with no reason and no penalty. The period starts at the conclusion, or on the day the customer receives the terms and the information if that is later. Tell the customer this period, and how to cancel. Source: ICOBS 7.1.1R and 7.1.3R. Not reviewed.
2. The 14 days do not apply to travel or baggage cover of less than one month, or to a policy fully performed at the consumer's request. Source: ICOBS 7.1.5R. Not reviewed.

## Sensitive data

1. Health data of a person needs an exception, for example the condition for insurance purposes. Never collect health details of a person. The customer gives them on the seller's page. Source: UK GDPR, art. 9; Data Protection Act 2018, Schedule 1, Part 2, para. 20. Not reviewed.
2. Never collect a National Insurance number, a bank account number or a card number. The customer gives them on the seller's page. Source: UK GDPR, art. 5(1)(c). Not reviewed.

## Complaints

1. The customer first complains to the seller, at its `complaints_url`. The seller sends a final response within 8 weeks, and that response names the Financial Ombudsman Service. Give the customer that address. Source: DISP 1.6.2R. Not reviewed.
2. The customer can then go to the Financial Ombudsman Service, for free, within 6 months of the final response. Source: DISP 2.8.2R. Not reviewed.
