"use client";

import { type RefObject, useActionState, useEffect, useRef, useState, useTransition } from "react";
import { checkListingServer, requestListing } from "@/lib/listing-request";
import {
  LISTING_COUNTRIES,
  LISTING_LIMITS,
  checkableLicences,
  type CheckStep,
  type Distributor,
  type ListingState,
  type ListingTextField,
  type ListingValues,
  type ServerCheck,
} from "@/lib/listings";
import { button, control, field, fieldRow, fieldHint, fieldLabel, fieldNote, formError } from "@/lib/ui";

const IDLE: ListingState = { status: "idle" };
const STEPS = ["Server", "Licences", "Contact"];

// The panel of a step, and the form of the first step inside it. Its text is
// ink-muted, and a heading takes the focus without an outline when the step changes.
const PANEL = "grid justify-items-start gap-6";
const PANEL_TEXT = "text-ink-muted";
const PANEL_HEADING = "text-title-3 focus:outline-none";
const ACTIONS = "flex flex-wrap gap-3";

// A button of the bar of the steps. A done step opens again on a click, and
// the current step has a thicker line.
const STEP_BUTTON =
  "flex w-full gap-2 border-t pt-3 text-left text-14 font-medium text-ink-subtle data-done:cursor-pointer data-done:border-ink-muted data-done:text-ink-muted data-done:hover:text-ink aria-[current=step]:border-t-2 aria-[current=step]:border-ink aria-[current=step]:pt-[11px] aria-[current=step]:text-ink";

// The checks of the server, and the licences it declares: a row for each, with
// its mark on the left.
const CHECK_LIST = "w-full border-t";
const CHECK_ROW = "grid grid-cols-[var(--space-6)_minmax(0,1fr)] gap-3 border-b py-4";
const CHECK_TITLE = "text-title-4 font-medium wrap-anywhere";
const CHECK_DETAIL = "text-14 text-ink-muted wrap-anywhere";

// The form of the /submit page, in three steps. The first runs the checks of
// the server, and the next steps open only when they pass. The second shows the
// licences that get_distributor declares, which the operator checks by hand.
// The last takes the contact details and sends the request. After the request
// is saved, a thank-you replaces the form.
export function ListingForm() {
  const [step, setStep] = useState(0);
  const [domain, setDomain] = useState("");
  const [check, setCheck] = useState<ServerCheck | null>(null);
  const [checking, startCheck] = useTransition();
  const [state, action, sending] = useActionState(requestListing, IDLE);
  const heading = useRef<HTMLHeadingElement>(null);
  const shown = useRef(step);

  // Move the focus to the heading of the step when the step changes.
  useEffect(() => {
    if (shown.current === step) return;
    shown.current = step;
    heading.current?.focus();
  }, [step]);

  if (state.status === "sent") {
    return (
      <div className={PANEL} role="status">
        <h2 className={PANEL_HEADING}>We have your request</h2>
        <p className={PANEL_TEXT}>We check each licence in its public register, then we answer you by email: listed, on hold or refused, with the reason.</p>
      </div>
    );
  }

  const passed = check?.status === "checked" && check.passed ? check : null;
  const runCheck = () =>
    startCheck(async () => {
      try {
        setCheck(await checkListingServer(domain));
      } catch {
        setCheck({ status: "invalid", message: "The check stopped on an error. Try again." });
      }
    });

  return (
    <>
      <ol className="grid grid-cols-3 gap-4">
        {STEPS.map((title, index) => (
          <li key={title}>
            <button
              className={STEP_BUTTON}
              type="button"
              disabled={index >= step}
              onClick={() => setStep(index)}
              aria-current={index === step ? "step" : undefined}
              data-done={index < step || undefined}
            >
              <span className="font-mono text-ink-subtle">{index + 1}</span>
              {title}
            </button>
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <div className={PANEL}>
          <h2 className={PANEL_HEADING} ref={heading} tabIndex={-1}>
            Check your server
          </h2>
          <form
            className={`${PANEL} w-full`}
            onSubmit={(event) => {
              event.preventDefault();
              runCheck();
            }}
          >
            <div className={field}>
              <label className={fieldLabel} htmlFor="listing-domain">
                Domain
              </label>
              <input
                className={control}
                id="listing-domain"
                value={domain}
                onChange={(event) => {
                  setDomain(event.target.value);
                  setCheck(null);
                }}
                inputMode="url"
                autoComplete="url"
                spellCheck={false}
                placeholder="pets.example.com"
                required
                maxLength={LISTING_LIMITS.domain}
                aria-describedby="listing-domain-hint"
              />
              <p className={fieldNote} id="listing-domain-hint">
                We read /.well-known/aip.json on this domain, then call the MCP server that it names.
              </p>
            </div>
            <div className={ACTIONS}>
              <button className={button({ primary: !passed })} type="submit" disabled={checking}>
                {checking ? "Checking…" : check ? "Check again" : "Check the server"}
              </button>
              {passed ? (
                <button className={button({ primary: true })} type="button" onClick={() => setStep(1)}>
                  Continue
                </button>
              ) : null}
            </div>
          </form>
          <div className="w-full empty:hidden" aria-live="polite">
            {check?.status === "invalid" ? (
              <p className={formError} role="alert">
                {check.message}
              </p>
            ) : null}
            {check?.status === "checked" ? <CheckList steps={check.steps} /> : null}
          </div>
        </div>
      ) : null}

      {step === 1 && passed?.distributor ? (
        <Licences domain={passed.domain} distributor={passed.distributor} heading={heading} onBack={() => setStep(0)} onNext={() => setStep(2)} />
      ) : null}

      {step === 2 && passed ? (
        <form className={PANEL} action={action}>
          <h2 className={PANEL_HEADING} ref={heading} tabIndex={-1}>
            Your contact details
          </h2>
          <input type="hidden" name="domain" value={passed.domain} />
          {/* Two fields side by side, one above the other on a narrow screen. */}
          <div className={fieldRow}>
            <TextField name="firstName" label="First name" autoComplete="given-name" state={state} />
            <TextField name="lastName" label="Last name" autoComplete="family-name" state={state} />
          </div>
          <TextField name="email" label="Work email" type="email" autoComplete="email" state={state} />
          <div className={field}>
            <label className={fieldLabel} htmlFor="listing-message">
              Message <span className={fieldHint}>Optional</span>
            </label>
            <textarea
              className={`${control} resize-y`}
              id="listing-message"
              name="message"
              rows={4}
              maxLength={LISTING_LIMITS.message}
              defaultValue={values(state)?.message}
            />
          </div>
          <div className="sr-only" aria-hidden="true">
            <label htmlFor="listing-url">URL</label>
            <input id="listing-url" name="url" tabIndex={-1} autoComplete="off" />
          </div>
          {state.status === "error" ? (
            <p className={formError} role="alert">
              {state.message}
            </p>
          ) : null}
          <div className={ACTIONS}>
            <button className={button()} type="button" onClick={() => setStep(1)}>
              Back
            </button>
            <button className={button({ primary: true })} type="submit" disabled={sending}>
              {sending ? "Sending…" : "Send the request"}
            </button>
          </div>
          <p className="text-14 text-ink-subtle">We use these details only to check your server and to answer you.</p>
        </form>
      ) : null}
    </>
  );
}

function CheckList({ steps }: { steps: CheckStep[] }) {
  return (
    <ol className={CHECK_LIST}>
      {steps.map((item) => (
        <li key={item.id} className={CHECK_ROW} data-status={item.status}>
          <StatusIcon status={item.status} />
          <div>
            <p className={`${CHECK_TITLE} ${item.status === "not_run" ? "text-ink-subtle" : "text-ink"}`}>
              {item.title}
              <span className="sr-only"> {item.status === "passed" ? "passed" : item.status === "failed" ? "failed" : "did not run"}</span>
            </p>
            <p className={CHECK_DETAIL}>{item.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

// The colour of the mark of each status.
const STATUS_COLOUR: Record<CheckStep["status"], string> = {
  passed: "text-positive",
  failed: "text-critical",
  not_run: "text-ink-subtle",
};

function StatusIcon({ status }: { status: CheckStep["status"] }) {
  return (
    <svg
      className={`mt-0.5 ${STATUS_COLOUR[status]}`}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {status === "passed" ? <path d="M5 10.5l3.5 3.5L15 7" /> : status === "failed" ? <path d="M6 6l8 8M14 6l-8 8" /> : <path d="M6 10h8" />}
    </svg>
  );
}

type LicencesProps = {
  domain: string;
  distributor: Distributor;
  heading: RefObject<HTMLHeadingElement | null>;
  onBack: () => void;
  onNext: () => void;
};

function Licences({ domain, distributor, heading, onBack, onNext }: LicencesProps) {
  const checkable = checkableLicences(distributor);
  const countryName = (code: string) => LISTING_COUNTRIES.find((country) => country.code === code)?.name;
  return (
    <div className={PANEL}>
      <h2 className={PANEL_HEADING} ref={heading} tabIndex={-1}>
        Your licences
      </h2>
      {distributor.licences.length === 0 ? (
        <p className={formError} role="alert">
          Your server declares no licence. Add each licence to the result of get_distributor, then check the server again.
        </p>
      ) : (
        <>
          <p className={PANEL_TEXT}>
            We check each licence of {distributor.legalName} in its public register, and confirm with the holder of the entry that {domain} is
            theirs.
          </p>
          <ul className={CHECK_LIST}>
            {distributor.licences.map((licence) => (
              <li key={`${licence.country}-${licence.register}-${licence.identifier}`} className={CHECK_ROW}>
                <span className="font-mono text-13/6 text-ink-subtle">{licence.country}</span>
                <div>
                  <p className={`${CHECK_TITLE} text-ink`}>
                    {licence.register} {licence.identifier}
                  </p>
                  <p className={CHECK_DETAIL}>
                    {licence.role}, {licence.regulator}
                    {countryName(licence.country) ? "" : ". AIP does not support this country yet."}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {checkable.length === 0 ? (
            <p className={formError} role="alert">
              AIP does not support the countries of these licences yet. The registry covers {LISTING_COUNTRIES.map((country) => country.name).join(", ")}.
            </p>
          ) : null}
        </>
      )}
      <div className={ACTIONS}>
        <button className={button()} type="button" onClick={onBack}>
          Back
        </button>
        <button className={button({ primary: true })} type="button" onClick={onNext} disabled={checkable.length === 0}>
          Continue
        </button>
      </div>
    </div>
  );
}

function values(state: ListingState): ListingValues | undefined {
  return state.status === "error" ? state.values : undefined;
}

type TextFieldProps = {
  name: Exclude<ListingTextField, "domain" | "message">;
  label: string;
  type?: "text" | "email";
  autoComplete: string;
  state: ListingState;
};

function TextField({ name, label, type = "text", autoComplete, state }: TextFieldProps) {
  const id = `listing-${name}`;
  return (
    <div className={field}>
      <label className={fieldLabel} htmlFor={id}>
        {label}
      </label>
      <input
        className={control}
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        maxLength={LISTING_LIMITS[name]}
        defaultValue={values(state)?.[name]}
      />
    </div>
  );
}
