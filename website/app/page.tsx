import Link from "next/link";
import { ExplainerVideo } from "@/components/home/explainer-video";
import {
  SaleStepper,
  type Party,
  type Sale,
  type SaleCall,
  type SaleMessage,
  type SaleOffer,
  type SaleOffers,
  type SaleProduct,
  type SaleProducts,
  type SaleStep,
} from "@/components/home/sale-stepper";
import { actions, column, columns, Hero, heroTitle, lede, Section, SectionHead } from "@/components/section";
import { readRepoJson } from "@/lib/repo-files";
import { EVALUATION_HREF, JOIN_HREF, REGISTRY_HREF, REPO_URL, SKILL_HREF, SPEC_HREF, TAGLINE } from "@/lib/site";
import { skillSteps, type SkillStep } from "@/lib/skill-content";
import { button, label } from "@/lib/ui";
import { RECHECK_DAYS, type RegistryToolName, type SearchDistributorsResult, type VerifyLicenceResult } from "@spec/registry";
import type { ToolName } from "@spec/schema";

// Each step of a sale through an agent, the party that owns it, and the
// record that proves it.
const OWNERS = [
  {
    step: "Set the rules that AI agents follow in a country",
    owner: "The regulator",
    proof: "The version of the rules file",
  },
  {
    step: "Find a seller and check its licence for the customer",
    owner: "The AI agent, through the registry. The AIP maintainers run the registry today, and the regulators can own it tomorrow.",
    proof: "The answer of the registry",
  },
  { step: "Advise, give the documents, quote and sell", owner: "The licensed seller, through its tools", proof: "The seller's record of the sale" },
  { step: "Confirm each answer of the declaration", owner: "The customer", proof: "Their approval, which the seller keeps" },
];

/** A call of a tool, or the read of a file, shown in code. */
function call(
  from: Party,
  to: Party,
  label: ToolName | RegistryToolName | "/.well-known/aip.json",
  result: string,
  stop?: boolean,
): SaleCall {
  return { kind: "call", from, to, label, code: true, result, ...(stop && { stop }) };
}

/** A read that only the details of the step show, never the chat. */
const quietly = (read: SaleCall): SaleCall => ({ ...read, quiet: true });

/** What the customer does on the seller's page. The chat shows `label` after their name. */
function act(label: string, result: string): SaleCall {
  return { kind: "call", from: "customer", to: "seller", label, code: false, result };
}

const say = (text: string): SaleMessage => ({ kind: "message", from: "customer", text });
const answer = (text: string): SaleMessage => ({ kind: "message", from: "agent", text });
const products = (...list: SaleProduct[]): SaleProducts => ({ kind: "products", products: list });
const offers = (...list: SaleOffer[]): SaleOffers => ({ kind: "offers", offers: list });


// The sale of the explainer video, on the steps of the skill: Alice insures
// her cat in Texas, and Acme Pets, a licensed seller, sells the policy. Each
// key is the title of a step in guidelines.md.
// A seller registers long before a sale, and the registry lists it only
// after a review. Nothing of it happens in the chat.
const LISTING: SaleStep = {
  kicker: "Before the sale",
  title: "Acme Pets registers",
  text: "Weeks before any sale, Acme Pets asks to join the AIP registry. The registry lists a seller only after it validates the seller's licence in the country where it sells, here Texas.",
  checks: [
    "Acme Pets publishes `/.well-known/aip.json`, which proves that it controls its domain.",
    "The registry calls `get_distributor` on its server, and reads the licence that it claims.",
    "It checks the licence in the public register of Texas, and the holder of the licence confirms the domain.",
    "It checks that the server has every tool of its level.",
    `It lists Acme Pets, and checks it again at least every ${RECHECK_DAYS} days.`,
  ],
  chat: [],
  owner: "The registry, run by the AIP maintainers",
  proof: "The licence check of the listing",
};

const SALE: Record<string, Omit<SaleStep, "title">> = {
  "Understand the need": {
    text: "Alice says what she wants to insure, where she lives and what the cover must do. The AI agent records her words, and loads the rules of Texas and of pet insurance there. The state insurance department owns these rules.",
    chat: [
      say("Can you insure my cat? We live in Texas, and I'd like her vet bills covered."),
      call("agent", "registry", "get_country_rules", "The rules of Texas and of pet insurance there, with their version"),
      answer("Happy to help. Let me find a licensed pet insurer in Texas for you."),
    ],
    owner: "Alice and her AI agent",
    proof: "The version of the rules file",
  },
  "Find a licensed seller": {
    text: "The registry gives the sellers that hold a licence for pet insurance in Texas, each with its MCP server and a recent licence check. For a seller found anywhere else, the AI agent asks the registry to check its licence.",
    chat: [
      call("agent", "registry", "search_distributors", "Acme Pets, with its MCP server and a licence check for Texas"),
      answer("Found one. Acme Pets sells pet insurance in Texas, and they're licensed there."),
    ],
    owner: "The AI agent, through the registry",
    proof: "The registry answer",
  },
  "Keep the products that fit": {
    text: "Acme Pets returns only the products whose underwriting scope covers a cat in Texas. Its pet insurance has two tiers, Essential and Complete, each with its cover. The product also gives the conditions of its scope and its documents, but no price yet. The AI agent shows the tiers side by side, and checks the conditions with Alice before it asks any question. The registry has already checked the licence, so the AI agent does not check it again.",
    chat: [
      call("agent", "seller", "list_products", "Pet insurance, whose scope covers a cat in Texas, in two tiers, with its conditions and its documents"),
      answer("Acme Pets has pet insurance in two tiers. Here's what each one covers, and who it's for. Does your cat fit the conditions?"),
      products({
        name: "Pet insurance",
        summary: "Pays back the vet bills of a cat or a dog after an accident or an illness.",
        tiers: [
          { name: "Essential", facts: [["Covers", "Accident, illness"], ["Annual limit", "$3,000"], ["Reimbursement", "70%"]] },
          { name: "Complete", facts: [["Covers", "Accident, illness, check-up"], ["Annual limit", "$10,000"], ["Reimbursement", "90%"]] },
        ],
        conditions: [
          "A cat or a dog that lives with you in Texas",
          "8 weeks to 10 years old when the cover starts",
          "Not for a pet used for breeding or for work",
        ],
        documents: ["Sample policy", "Outline of coverage"],
      }),
      say("She's four and she's just our pet, so both look fine."),
    ],
    owner: "The AI agent, on the seller's scope",
    proof: "The scope of the product",
  },
  "Ask the questions and quote": {
    text: "The AI agent sends Acme Pets what Alice already said. Acme Pets gives its questions, and asks only the ones that are still open. Then it gives two offers. The AI agent shows each offer in the seller's words, with no ranking. Only the seller advises.",
    chat: [
      call("agent", "seller", "quote", "The seller's questions. The chat already answers most of them, so three are open: the cat's name, its breed, and whether it is spayed."),
      answer("Acme Pets has three quick questions: what's your cat's name, what breed is she, and is she spayed?"),
      say("Miso, a domestic shorthair, and yes, she's spayed."),
      call("agent", "seller", "quote", "Two indicative offers"),
      answer("Here are your two quotes, side by side. Acme Pets confirms the final price when you apply."),
      offers(
        { plan: "Essential", price: "$14.90", period: "/ month", facts: [["Annual limit", "$3,000"], ["Reimbursement", "70%"], ["Deductible", "$250"]] },
        { plan: "Complete", price: "$24.50", period: "/ month", facts: [["Annual limit", "$10,000"], ["Reimbursement", "90%"], ["Deductible", "$100"]] },
      ),
    ],
    owner: "The licensed seller, through its tools",
    proof: "The offers",
  },
  Apply: {
    text: "Alice picks an offer. The AI agent applies for it with the parties. It does not send the answers again, because Acme Pets takes them from the offer. Acme Pets returns a summary and the link to its page, and nothing is committed yet.",
    chat: [
      say("Let's go with Complete."),
      call("agent", "seller", "submit_application", "A summary of the price and of each answer with its source, and the page where Alice approves"),
      answer("Last step: on Acme Pets' page, check your answers, the price and the start date, then approve and pay. Here's the link."),
    ],
    owner: "The AI agent, with the seller's summary",
    proof: "The summary of the application",
  },
  "Get the customer's approval": {
    text: "On Acme Pets' page, Alice reads each answer and its source, the documents and the final terms, and approves them once. Then she pays on the same page, so her card details never reach the AI agent. Acme Pets keeps what she approved.",
    chat: [
      act("approves the terms and pays on Acme Pets' page", "She checks each answer and its source, reads the documents, and approves the price, the start date, the insurer and the withdrawal period. Then she pays on the same page. The AI agent never sees the payment."),
      say("Done, I've paid."),
      quietly(call("agent", "seller", "get_operation", "Approved by Alice")),
      answer("Great. Acme Pets will email you the policy, and I've saved a copy of everything."),
    ],
    owner: "Alice approves, and the seller sells",
    proof: "The seller's record of what she approved",
  },
};

function saleStep(title: string): SaleStep {
  const step = SALE[title];
  if (!step) throw new Error(`app/page.tsx: no sale text for the skill step "${title}"`);
  return { title, ...step };
}

// Sam compares two sellers in the United Kingdom, where an AI agent must not
// rank the offers. The sellers are at level 2, so Sam buys on the site of the
// seller they choose.
const COMPARISON: SaleStep[] = [
  {
    title: "Understand the need",
    text: "Sam rents a flat in Leeds and wants cover for their belongings. The AI agent loads the rules of the United Kingdom. To recommend an offer, or to rank the offers, is advice, and advice needs an FCA authorisation.",
    chat: [
      say("I rent a flat in Leeds. Can you find me contents insurance?"),
      call("agent", "registry", "get_country_rules", "The rules of the United Kingdom, with their version"),
      answer("Sure. I'll get quotes from a couple of authorised insurers so you can compare them."),
    ],
    owner: "Sam and their AI agent",
    proof: "The version of the rules file",
  },
  {
    title: "Find the licensed sellers",
    text: "The registry gives two sellers that the FCA authorises for home insurance, each with a licence check. The order of the list is random, so the AI agent shows no ranking.",
    chat: [
      call("agent", "registry", "search_distributors", "Two sellers, each with a licence check, in a random order"),
      answer("Example Home and Example Cover both insure flats in Leeds. I'm asking each of them for a quote."),
    ],
    owner: "The AI agent, through the registry",
    proof: "The registry answer",
    seller: "Two sellers",
  },
  {
    title: "Quote with each seller",
    text: "The AI agent sends each seller what Sam already said, and each seller lists the questions that are still open. Then each one gives its offer. The AI agent shows them side by side, with the same fields in the same order, so that Sam compares them alone. When Sam asks which one is best, the AI agent sends the question to the sellers.",
    chat: [
      call("agent", "seller", "quote", "The questions of each seller. Two are open: the postcode and the floor area."),
      answer("Both insurers just need your postcode and roughly how big the flat is."),
      say("LS6, and about 55 square metres."),
      call("agent", "seller", "quote", "The indicative offer of each seller, and its statement of Sam's demands and needs"),
      answer("Here are both offers, laid out the same way so they're easy to compare. Each insurer confirms its final price when you buy."),
      offers(
        { seller: "Example Home", plan: "Contents", price: "£9.80", period: "/ month", facts: [["Contents cover", "£25,000"], ["Excess", "£100"], ["Accidental damage", "Included"]] },
        { seller: "Example Cover", plan: "Contents", price: "£8.60", period: "/ month", facts: [["Contents cover", "£20,000"], ["Excess", "£250"], ["Accidental damage", "Optional"]] },
      ),
      say("Which one would you pick?"),
      answer("That's your call, so I won't pick one for you. Both insurers can give you advice if you'd like it."),
    ],
    owner: "The licensed sellers, through their tools",
    proof: "The offers, and each seller's statement of demands and needs",
    seller: "Two sellers",
  },
  {
    title: "Buy on the seller's site",
    text: "Sam picks the offer of Example Home. Example Home is at level 2: it gives offers, and takes no application from an AI agent. The offer carries a link to Example Home's page, where Sam checks the answers, buys this exact offer and gives their bank details.",
    chat: [
      say("I'll take the Example Home one with the lower excess."),
      answer("Example Home finishes the purchase on their own site. This link takes you straight to your offer."),
      act("buys the offer on Example Home's site", "The `handoff_url` of the offer opens this exact offer on the seller's page"),
      answer("I've kept a copy of the offer and your answers."),
    ],
    owner: "Sam and the seller",
    proof: "The offer and the answers, kept by the AI agent",
    seller: "Example Home",
  },
];

// Camille asks for a seller found on the web, and the registry finds no
// licence for it in France. The seller and the registry's words come from the
// worked example, so that the page and the spec cannot disagree.
function licenceStop(): SaleStep[] {
  const check = readRepoJson<VerifyLicenceResult>("spec/examples/registry-08-verify_licence.result.no_licence.json");
  const { distributors } = readRepoJson<SearchDistributorsResult>("spec/examples/registry-04-search_distributors.result.json");
  const { params, outcome } = check;
  const listed = distributors[0];
  if (params.capacity !== "distributor" || !params.subject.legal_name || !params.subject.identifier || outcome.verdict !== "not_licensed" || !listed) {
    throw new Error("app/page.tsx: the licence check of the example no longer gives not_licensed for a named seller");
  }
  const { domain, legal_name: name, identifier } = params.subject;
  const seller = "Pet Cover Online";
  const found = listed.trading_name ?? listed.legal_name;
  const role = listed.roles[0] ?? "seller";
  return [
    {
      title: "Understand the need",
      text: "Camille found a pet insurer on the web, and asks the AI agent to insure their dog with it. The AI agent loads the rules of France: a seller of insurance must be in ORIAS, the register of intermediaries.",
      chat: [
        say(`I found ${domain}. Can you insure my dog with them?`),
        call("agent", "registry", "get_country_rules", "The rules of France, with their version"),
        answer("Sure. Let me check that they're allowed to sell insurance in France first."),
      ],
      owner: "Camille and their AI agent",
      proof: "The version of the rules file",
      seller,
    },
    {
      title: "Check the seller",
      text: `The seller's server says that it is ${name}, with the ORIAS number ${identifier.identifier}. The registry looks for this number and this name in ORIAS, and finds neither.`,
      chat: [
        call("agent", "seller", "get_distributor", `${name}, with the ORIAS number ${identifier.identifier}`),
        call("agent", "registry", "verify_licence", `\`${outcome.verdict}\`, for the reason \`${outcome.reason}\``, true),
      ],
      owner: "The AI agent, through the registry",
      proof: "The licence check, with the register and the time of the read",
      seller,
    },
    {
      title: "Stop with this seller",
      text: "The AI agent sends this seller no answer of Camille's, and never applies through it. It tells Camille why, in the words of the registry, and keeps the licence check.",
      chat: [
        answer(`I couldn't find ${name} in ORIAS, the official register, so they can't sell insurance in France.`),
        answer("I haven't shared anything about you or your dog with them."),
      ],
      owner: "The AI agent",
      proof: "The licence check, kept for Camille",
      seller,
    },
    {
      title: "Find a licensed seller",
      text: `The registry lists ${found}, a ${role} in ORIAS, with a recent licence check. From here, the sale goes on as in Texas.`,
      chat: [
        say("Who can I use instead?"),
        call("agent", "registry", "search_distributors", `${found}, with a licence check for France`),
        answer(`${found} is a registered ${role} and sells pet insurance in France. Want me to get you a quote?`),
        say("Yes, please."),
      ],
      owner: "The AI agent, through the registry",
      proof: "The registry answer",
      seller: found,
    },
  ];
}

function sales(steps: SkillStep[]): Sale[] {
  return [
    {
      id: "texas",
      tag: "Texas · Level 3",
      title: "Insure a cat, as in the video",
      summary: `Alice insures her cat with Acme Pets, a licensed seller. The AI agent follows the ${steps.length} steps of the skill, and Alice applies on Acme Pets' page.`,
      customer: "Alice",
      seller: "Acme Pets",
      steps: [LISTING, ...steps.map((step) => saleStep(step.title))],
    },
    {
      id: "united-kingdom",
      tag: "United Kingdom · Level 2",
      title: "Compare two sellers",
      summary:
        "Sam gets quotes from two sellers. The AI agent shows the offers side by side and ranks none, because advice needs an FCA authorisation. The seller works at level 2, so Sam buys on its site.",
      customer: "Sam",
      seller: "Example Home",
      steps: COMPARISON,
    },
    {
      id: "france",
      tag: "France · Licence check",
      title: "Stop at a seller with no licence",
      summary: "Camille asks for a seller found on the web. ORIAS has no entry for it, so the AI agent sends it nothing and finds a licensed seller in the registry.",
      customer: "Camille",
      seller: "Pet Cover Online",
      steps: licenceStop(),
    },
  ];
}

const AUDIENCES = [
  {
    name: "People and companies who buy insurance",
    gain: "Buy the right product, from a licensed seller, at a real price, with the answers that you confirmed",
    points: [
      { lead: "See the full offer", text: "with its cover, limits, excess and documents, before you commit." },
      { lead: "Confirm each answer", text: "yourself, on the seller's page, before you commit." },
      { lead: "Pay on the seller's page,", text: "so your card details never reach the AI agent." },
    ],
  },
  {
    name: "Insurers and distributors",
    gain: "Sell through AI agents, and know who did each step",
    points: [
      { lead: "Keep the evidence", text: "of each sale: the licence checked, the documents delivered and the declaration that the customer approved." },
      { lead: "Give AI agents the full offer", text: "with its cover, limits, excess and documents, through one set of tools." },
      { lead: "Choose your level", text: "of AIP, and keep the sensitive questions on your own page." },
    ],
  },
  {
    name: "AI agents",
    gain: "One way to help people with insurance, in each country",
    points: [
      { lead: "Load one skill", text: "and your AI agent follows the rules of the customer's country." },
      { lead: "Follow each regulator's rules on advice,", text: "leave the sale to licensed sellers, and show the customer the full offer before any commitment." },
      { lead: "Check every seller", text: "in the public registers before your AI agent sends anything." },
    ],
  },
  {
    name: "Regulators",
    gain: "Rules that AI agents can follow",
    points: [
      { lead: "Read in minutes", text: "what an AI agent does in your country, step by step." },
      { lead: "Change your country file", text: "and every AI agent that loads the skill follows the new version." },
      { lead: "Own the registry and the skill of your market", text: "when you are ready. The skill then carries your name." },
    ],
  },
];

const PARTS = [
  {
    name: "The registry",
    who: "One, run by the AIP maintainers",
    text: "Finds the sellers that speak AIP in a country, checks a licence in the public registers of the customer's country, and serves the rules of each country. It never gets customer data. Tomorrow, the regulators can own and control it directly.",
    tools: ["search_distributors", "verify_licence", "get_country_rules"],
    href: REGISTRY_HREF,
    link: "Read the registry spec",
  },
  {
    name: "The MCP standard",
    who: "For the MCP server of any seller",
    text: "Any MCP server can speak AIP. To be AIP certified, it has the standard tools of one of three levels: the products with their underwriting scope and their documents, the quote with its questions, and the application that the customer approves. The registry checks the tools before it lists the seller.",
    tools: ["get_distributor", "list_products", "quote", "submit_application", "get_operation"],
    href: SPEC_HREF,
    link: "Read the spec",
  },
  {
    name: "The skill",
    who: "For every AI agent",
    text: "How an AI agent uses AIP, from the first question to the application. It is open source, and any assistant can load it. Each regulator will own the skill of its market: the rules that an AI agent follows there.",
    tools: [],
    href: SKILL_HREF,
    link: "Read the skill",
  },
  {
    name: "The evaluation",
    who: "For every AI agent, country by country",
    text: "Test cases that check that an AI agent, with the skill loaded, follows the rules of each country. Each case names the rule it tests, and the regulator that owns the rule owns the case. An AI agent that does not reach the required score of a country does not buy insurance through AIP there. As with a self-driving car, each new version is tested again.",
    tools: [],
    href: EVALUATION_HREF,
    link: "Read the evaluation",
  },
];

// A summary of each country file of the skill. The files hold the rules and
// their legal sources.
const COUNTRIES = [
  {
    code: "us",
    name: "United States",
    authority: "Regulator: the insurance department of each state.",
    link: "Read the rules of the United States",
    points: [
      {
        lead: "A licence covers one state.",
        text: "The seller needs a producer licence of the customer's state for the line. A licence of another state does not cover the customer.",
      },
      { lead: "Soliciting needs a licence.", text: "An AI agent that urges the customer to buy from one company solicits, paid or not." },
    ],
  },
  {
    code: "gb",
    name: "United Kingdom",
    authority: "Regulators: the FCA, and the PRA for insurers. Register: the Financial Services Register.",
    link: "Read the rules of the United Kingdom",
    points: [
      {
        lead: "The FCA authorises each seller.",
        text: "A firm sells under its own authorisation or as an appointed representative. To sell without one is a criminal offence.",
      },
      {
        lead: "Advice needs an authorisation.",
        text: "An AI agent must not recommend or rank the offers. A neutral list of the policies that match the customer need not be advice.",
      },
    ],
  },
  {
    code: "fr",
    name: "France",
    authority: "Regulator: the ACPR. Registers: ORIAS and REGAFI.",
    link: "Read the rules of France",
    points: [
      {
        lead: "Each intermediary is in ORIAS.",
        text: "The insurer behind the offer holds an ACPR authorisation or the passport of another EU country.",
      },
      {
        lead: "The advice belongs to the seller.",
        text: "An AI agent must not recommend an offer, rank the offers, or explain the cover in its own words.",
      },
    ],
  },
];

const ISSUE_FORMS = [
  { template: "1-feedback.yml", title: "Spec feedback", text: "A gap, an ambiguity or a risk in the schema or the rules." },
  { template: "2-implementation-report.yml", title: "Implementation report", text: "What you ran into as the maker of an AI agent or as a seller." },
  { template: "4-proposal.yml", title: "New topic", text: "Something many implementations need that the draft does not cover." },
];

// Under each column: the points, one per --line rule. In the aligned columns of
// the countries, each row lines up across the columns, as in a table. A
// country has five rows: the name, the regulator, two points and the link.
const gain = "-mt-2 text-15 text-ink-subtle";
const points = "mt-2 grid";
const point = "border-t py-3 text-15 text-ink-muted";
const columnLink = "mt-2 justify-self-start font-medium";
const note = "mt-6 max-w-measure text-14/5.5 text-ink-subtle";
const placeholder =
  "grid aspect-video place-items-center rounded-md border border-dashed border-line-control bg-surface p-6 text-center text-14/6.5 text-ink-subtle";

function Points({ items, aligned = false }: { items: { lead: string; text: string }[]; aligned?: boolean }) {
  return (
    <ul className={aligned ? `${points} row-span-2 grid-rows-subgrid gap-0` : points}>
      {items.map((item) => (
        <li key={item.lead} className={point}>
          <strong className="font-semibold text-ink">{item.lead}</strong> {item.text}
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  const steps = skillSteps();
  return (
    <div data-flush>
      <Hero aside={<ExplainerVideo />}>
        <p className={label}>Draft 0.1 · US, UK, France</p>
        <h1 className={heroTitle}>{TAGLINE}</h1>
        <p className={lede}>
          AI agents already fill in insurers&apos; forms and get quotes for people, outside the rules that every broker and insurer follows. AIP
          proposes one set of rules for the whole market. The AI agent buys only from a seller licensed in the customer&apos;s country and follows
          that country&apos;s rules, the customer confirms each answer, and each step keeps a proof of who did it. It is a first version, for
          insurers to agree on and for regulators to own.
        </p>
        <div className={actions}>
          <a className={button({ primary: true })} href={SPEC_HREF}>
            Read the spec
          </a>
          <Link className={button()} href={JOIN_HREF}>
            Become a launch partner
          </Link>
        </div>
      </Hero>

      <Section id="why">
        <SectionHead title="Why it exists">
          <p>
            AI agents now open insurers&apos; websites, fill in the forms and get quotes for the people they serve. Meta launched Muse in September,
            and Instinct, OpenAI Dots and Claude Duet followed. Insurance is a regulated market, and in each country a regulator decides who may sell,
            who may advise, which documents the customer reads before they commit and what they must confirm. Every broker and every insurer follows
            those rules on each sale. No rule applies yet to an AI agent that buys insurance for someone, so people now buy cover outside the rules of
            their market.
          </p>
          <p>
            Each insurer answers alone. Insurify blocked Muse, then opened a gateway with rules of its own. Kin opened its site to AI agents, and
            Lemonade built its own platform for them. An insurer can block AI agents, let them in with no rules, or write rules of its own, and none
            of these works in a regulated market. A block turns away every customer who chose an AI agent. An open site takes sales that no rule
            covers, and rules that each seller writes for itself work as if each broker chose the law of its own sales. With the three side by side
            in one market, an AI agent meets different rules at each insurer.
          </p>
          <p>
            We think one set of rules should apply to the whole market, and that the regulator should set them, as it does for brokers and insurers
            today. So we built the <strong>Agentic Insurance Protocol</strong>, or AIP, a first version for the market to agree on and for the
            regulators to take over. The regulator of each market decides what an AI agent may do there, advice included, and owns the tests it must
            pass. Every sale goes through a licensed seller, and the buyer confirms each answer themselves.{" "}
            <a href="https://personalagentprotocol.org">PAP</a> already tells the seller who the AI agent is, and AIP adds what the law lets it do.
          </p>
        </SectionHead>
        {/* One numbered step per line, then a cell for each fact about it, each under its own label. */}
        <ol className="mb-8 border-t border-ink">
          {OWNERS.map((item, index) => (
            <li
              key={item.step}
              className="grid grid-cols-[minmax(0,5fr)_minmax(0,4fr)_minmax(0,3fr)] gap-x-8 gap-y-3 border-b py-6 max-lg:grid-cols-2 max-sm:grid-cols-1"
            >
              <h3 className="flex gap-3 text-title-4 max-lg:col-span-full">
                <span className="font-mono font-medium text-ink-subtle">{index + 1}</span>
                {item.step}
              </h3>
              <div>
                <p className={`${label} mb-1`}>Owner</p>
                <p className="text-ink-muted">{item.owner}</p>
              </div>
              <div>
                <p className={`${label} mb-1`}>Proof</p>
                <p className="text-ink-muted">{item.proof}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="who">
        <SectionHead title="Built for buyers, insurers, AI agents and regulators">
          <p>
            A buyer gets the full offer from a licensed seller. Any licensed seller can take part, any AI agent can load the skill, and any regulator can
            take over the skill of its market.
          </p>
        </SectionHead>
        <ul className={columns(2)}>
          {AUDIENCES.map((audience) => (
            <li key={audience.name} className={column}>
              <h3 className="text-title-3">{audience.name}</h3>
              <p className={gain}>{audience.gain}</p>
              <Points items={audience.points} />
            </li>
          ))}
        </ul>
      </Section>

      <Section id="partners" split>
        <SectionHead title="Launch partners" split>
          <p>
            AIP is open source. Every participant can contribute, and the goal is that the regulators take ownership of it. The partners meet on an
            agreed cadence to align the protocol.
          </p>
          <div className={actions}>
            <Link className={button({ primary: true })} href={JOIN_HREF}>
              Become a launch partner
            </Link>
          </div>
        </SectionHead>
        <div className={placeholder}>Launched with [partner logos]</div>
      </Section>

      <Section id="blocks">
        <SectionHead title="The building blocks">
          <p>
            AIP has four building blocks: a registry of licensed sellers, an MCP standard for insurers, a skill for AI agents, and an evaluation
            that tests each AI agent on the rules of each country.
          </p>
        </SectionHead>
        <ul className={columns(2)}>
          {PARTS.map((part) => (
            <li key={part.name} className={column}>
              <p className="text-label text-ink-muted uppercase">{part.who}</p>
              <h3 className="-mt-1 text-title-3">{part.name}</h3>
              <p className="text-ink-muted">{part.text}</p>
              {part.tools.length > 0 && (
                <span className="flex flex-wrap gap-x-3 gap-y-1 text-13">
                  {part.tools.map((tool) => (
                    <code key={tool}>{tool}</code>
                  ))}
                </span>
              )}
              <a className={columnLink} href={part.href}>
                {part.link}
              </a>
            </li>
          ))}
        </ul>
        <h3 className="mt-16 mb-2 text-title-3">The rules of each country</h3>
        <p className="mb-6 max-w-measure text-ink-muted">
          Each country has its own rules, in the skill of its market. The AI agent follows the law of the customer&apos;s country, where the customer lives and where
          the insured good is, whatever the seller&apos;s country. Draft 0.1 has the rules of three countries. Outside them, the AI agent tells the customer that AIP does not support their country yet.
        </p>
        <ul className={columns(3)}>
          {COUNTRIES.map((country) => (
            <li key={country.code} className={`${column} row-span-5 grid-rows-subgrid`}>
              <h4 className="text-18">{country.name}</h4>
              <p className={gain}>{country.authority}</p>
              <Points items={country.points} aligned />
              <a className={columnLink} href={`${SKILL_HREF}/${country.code}`}>
                {country.link}
              </a>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="example">
        <SectionHead title="From discovery to the contract">
          <p>
            Three sales, one in each country of draft 0.1. Alice insures her cat in Texas, as in the video, and the AI agent follows the{" "}
            {steps.length} steps of the skill. In the United Kingdom, Sam compares two sellers, and the AI agent must not rank their offers. A
            seller found on the web has no licence in France, so the AI agent stops before it sends any data.{" "}
            <a href={`${SKILL_HREF}#what-the-ai-agent-does`}>Read each step of the skill</a>.
          </p>
        </SectionHead>
        <SaleStepper sales={sales(steps)} />
        <p className={note}>Each proof names who did the step, and the version of the rules that applied.</p>
      </Section>

      <Section id="test" split>
        <SectionHead title="A version in test" split>
          <p>
            An AI agent with the skill, a test registry and a test insurer server gets a quote that follows the protocol. The companies and the data in
            the test are fictional.
          </p>
        </SectionHead>
        <div className={placeholder}>[Recording of the test run]</div>
      </Section>

      <Section id="regulators">
        <SectionHead title="Bring your insurer, your AI agent or your country's rules onto AIP">
          <p>
            AIP is a draft, built in the open. The skill gives an AI agent no licence, and only a regulator can say what an AI agent that follows its
            rules may do.
          </p>
          <p>
            The first rules files, for the United States, the United Kingdom and France, come from the AIP maintainers, and no lawyer or regulator
            has reviewed them yet. We ask each regulator to review the file of its country, to change it, and to take it over.
          </p>
        </SectionHead>
        <div className={actions}>
          <a className={button({ primary: true })} href={SPEC_HREF}>
            Read the spec
          </a>
          <a className={button()} href={`${SKILL_HREF}#your-country-your-rules`}>
            See the country files
          </a>
          <a className={button()} href={`${REPO_URL}/issues/new?template=1-feedback.yml`}>
            Give feedback
          </a>
        </div>
      </Section>

      <Section id="feedback">
        <SectionHead title="Shape the draft">
          <p>The draft changes with what implementers learn. Each link opens a GitHub issue form.</p>
        </SectionHead>
        <ul className="grid grid-cols-2 border-t max-sm:grid-cols-1">
          {ISSUE_FORMS.map((form) => (
            <li key={form.template} className="grid gap-1 border-b py-4 pr-6">
              <a className="font-semibold" href={`${REPO_URL}/issues/new?template=${form.template}`}>
                {form.title}
              </a>
              <span className="text-14/5.5 text-ink-subtle">{form.text}</span>
            </li>
          ))}
        </ul>
        <p className={note}>
          To report a weakness that could harm a live implementation, use{" "}
          <a href={`${REPO_URL}/security/advisories/new`}>private vulnerability reporting</a>.
        </p>
      </Section>
    </div>
  );
}
