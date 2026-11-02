import type { Metadata } from "next";
import { PartnerForm } from "@/components/partner-form";
import { JOIN_HREF, PARTNER_EMAIL, SPEC_HREF } from "@/lib/site";
import { label } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Become a launch partner",
  description: "Test draft 0.1 of AIP before the launch, as an insurer, an intermediary, an AI lab, a startup or a regulator.",
  alternates: { canonical: JOIN_HREF },
};

// What a launch partner does, for each type of company in the form.
const ROLES = [
  {
    who: "Insurers and intermediaries",
    text: "Put one product behind the MCP standard and run a test sale with an AI agent before the launch. The advice and the quote stay on your own tools.",
  },
  {
    who: "AI labs and startups",
    text: "No AI agent can hold an insurance licence in every market it serves. Once the regulators agree on AIP, each one says what an AI agent may do in its market without a licence, and a licensed seller does the rest. Load the skill now, and help settle those rules while they can still change.",
  },
  {
    who: "Regulators",
    text: "Read the rules of your country and the test cases that check them. Change what you need, and take both over when you are ready.",
  },
];

// What a launch partner does on the left, and the form in a card on the right,
// on --surface from the header to the footer. The page ends on its own --line
// border, so data-flush tells the footer to drop its border and its gap.
export default function Join() {
  return (
    <div className="border-b bg-surface" data-flush>
      <div className="wrap grid grid-cols-[minmax(0,5fr)_minmax(0,6fr)] items-start gap-16 pt-16 pb-24 max-lg:grid-cols-1 max-lg:gap-12 max-lg:pt-12 max-lg:pb-16">
        {/* The text stays in view, under the sticky header, while the reader fills in the form. */}
        <div className="sticky top-[calc(var(--height-header)+var(--space-16))] grid gap-4 max-lg:static">
          <p className={label}>Draft 0.1 · US, UK, France</p>
          <h1 className="text-title-1 max-sm:text-title-2">Become a launch partner</h1>
          <p className="text-17 text-ink-muted">
            AI agents already get quotes and buy insurance for people, outside the rules that every broker and insurer follows. AIP proposes one set
            of rules for the US, the UK and France, for the market to agree on and for the regulators to take over. Launch partners test <a href={SPEC_HREF}>draft 0.1</a> before the launch, and we meet on a schedule we set together to agree on each change.
          </p>
          <ul className="my-4 border-b">
            {ROLES.map((role) => (
              <li key={role.who} className="grid gap-1 border-t py-4">
                <p className={label}>{role.who}</p>
                <p className="text-ink-muted">{role.text}</p>
              </li>
            ))}
          </ul>
          <p className="text-14 text-ink-subtle">
            Partners who agree show their logo on the home page at the launch. We answer each request by email, and you can also write to{" "}
            <a href={`mailto:${PARTNER_EMAIL}`}>{PARTNER_EMAIL}</a>.
          </p>
        </div>
        <PartnerForm />
      </div>
    </div>
  );
}
