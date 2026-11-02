"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { button, label, pill } from "@/lib/ui";

// The sales of the home page, step by step. A tab for each sale. On the left,
// the chat between the customer and the AI agent, with a short line for each
// call of a tool and a card for each product and each offer. On the right,
// what happens at the step, the details of its calls, its owner and its proof.
// The reader moves from step to step.

export type Party = "customer" | "agent" | "registry" | "seller";

export interface SaleMessage {
  kind: "message";
  from: "customer" | "agent";
  text: string;
}

export interface SaleCall {
  kind: "call";
  from: Party;
  to: Party;
  /** The tool or the file, or what the customer does, after their name. */
  label: string;
  /** True when `label` is a tool or a file. */
  code: boolean;
  /** What the call gives, with `code` spans. */
  result: string;
  /** The call shows that the seller cannot sell. */
  stop?: boolean;
  /** A read that the chat does not show, such as `get_operation`. It stays in the details of the step. */
  quiet?: boolean;
}

/** An offer as the seller gives it. Every offer of a quote has the same facts, in the same order. */
export interface SaleOffer {
  /** Set when the offers come from more than one seller. */
  seller?: string;
  plan: string;
  price: string;
  period: string;
  facts: [label: string, value: string][];
}

/** The offers of a quote, side by side, with no ranking. */
export interface SaleOffers {
  kind: "offers";
  offers: SaleOffer[];
}

/** A tier of a product, with its cover and no price. Every tier of a product has the same facts, in the same order. */
export interface SaleTier {
  name: string;
  facts: [label: string, value: string][];
}

/** A product as `list_products` gives it: its tiers side by side, with no price, then its conditions and its documents. */
export interface SaleProduct {
  name: string;
  summary: string;
  tiers: SaleTier[];
  /** The conditions of its underwriting scope, in the seller's words. */
  conditions: string[];
  /** The titles of its documents. */
  documents: string[];
}

/** The products of a seller, with no ranking. */
export interface SaleProducts {
  kind: "products";
  products: SaleProduct[];
}

export interface SaleStep {
  title: string;
  /** Set on a step that comes before the procedure of the skill. */
  kicker?: string;
  /** What happens, with `code` spans. */
  text: string;
  /** The checks of a step that happens outside the chat, in order, with `code` spans. */
  checks?: string[];
  /** The messages, the calls, the products and the offers of the step, in order. */
  chat: (SaleMessage | SaleCall | SaleProducts | SaleOffers)[];
  owner: string;
  proof: string;
  /** The seller at this step, when it is not the seller of the sale. */
  seller?: string;
}

export interface Sale {
  id: string;
  tag: string;
  title: string;
  summary: string;
  customer: string;
  seller: string;
  steps: SaleStep[];
}

// The entries of a new step come in one after the other, after --delay.
const NEW = "animate-sale-in motion-reduce:animate-none";
const ENTRY_DELAY_MS = 500;
// The padding of the chat (p-4), kept above and below the entry in view.
const LOG_PADDING = 16;

/** Text with `code` spans. */
function withCode(text: string): ReactNode[] {
  return text.split("`").map((part, index) => (index % 2 === 1 ? <code key={index}>{part}</code> : part));
}

/** A wrench for a call of a tool, a person for what the customer does. */
function CallIcon({ tool }: { tool: boolean }) {
  return (
    <svg
      className="size-3.5 flex-none fill-none stroke-current stroke-2"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {tool ? (
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      ) : (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M20 21a8 8 0 0 0-16 0" />
        </>
      )}
    </svg>
  );
}

export function SaleStepper({ sales }: { sales: Sale[] }) {
  const id = useId();
  const [saleIndex, setSaleIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  // The details of the calls stay open from step to step once the reader opens them.
  const [details, setDetails] = useState(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const log = useRef<HTMLOListElement>(null);

  const sale = sales[saleIndex];
  const step = sale?.steps[stepIndex];

  // The chat follows each entry of the step as it comes in, as a chat does. An
  // entry takes its place before it fades in, so a jump to the end would hide the
  // first entries of a long step. An entry taller than the chat shows from its top.
  useEffect(() => {
    const element = log.current;
    if (!element) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fresh = [...element.querySelectorAll<HTMLElement>("[data-new]")];
    const first = fresh[0];
    const last = fresh.at(-1);
    if (!first || !last) return;
    const edges = (entry: HTMLElement) => {
      const offset = element.scrollTop - element.getBoundingClientRect().top;
      const box = entry.getBoundingClientRect();
      return { top: box.top + offset - LOG_PADDING, bottom: box.bottom + offset + LOG_PADDING - element.clientHeight };
    };
    if (still) {
      // Every entry is there at once: show the end of the step, but never above its first entry.
      element.scrollTo({ top: Math.min(edges(first).top, edges(last).bottom) });
      return;
    }
    const timers = fresh.map((entry, order) =>
      window.setTimeout(() => {
        const { top, bottom } = edges(entry);
        element.scrollTo({ top: Math.min(top, bottom), behavior: "smooth" });
      }, order * ENTRY_DELAY_MS),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [saleIndex, stepIndex]);

  if (!sale || !step) return null;

  function open(index: number) {
    setSaleIndex(index);
    setStepIndex(0);
  }

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    const move = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!move) return;
    event.preventDefault();
    const index = (saleIndex + move + sales.length) % sales.length;
    open(index);
    tabs.current[index]?.focus();
  }

  const last = stepIndex === sale.steps.length - 1;
  const lastSale = saleIndex === sales.length - 1;
  function next() {
    if (!last) setStepIndex(stepIndex + 1);
    else open(lastSale ? 0 : saleIndex + 1);
  }

  const entries = sale.steps
    .slice(0, stepIndex + 1)
    .flatMap((item, index) =>
      item.chat.filter((entry) => !(entry.kind === "call" && entry.quiet)).map((entry, order) => ({ entry, item, index, order })),
    );
  const calls = step.chat.filter((entry): entry is SaleCall => entry.kind === "call");
  const nameOf = (party: Party, item: SaleStep) =>
    ({ customer: sale.customer, agent: "AI agent", registry: "Registry", seller: item.seller ?? sale.seller })[party];
  const callName = (call: SaleCall, item: SaleStep) => (call.code ? <code>{call.label}</code> : `${nameOf(call.from, item)} ${call.label}`);

  // The list of calls already ends on a rule, so the owner drops its own.
  const callsOpen = details && calls.length > 0;

  return (
    <div>
      <div className="mb-6 grid grid-cols-3 gap-8 max-lg:grid-cols-1 max-lg:gap-0" role="tablist" aria-label="Sales">
        {sales.map((item, index) => (
          <button
            key={item.id}
            ref={(element) => {
              tabs.current[index] = element;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${item.id}`}
            aria-selected={index === saleIndex}
            aria-controls={`${id}-panel`}
            tabIndex={index === saleIndex ? 0 : -1}
            className="grid cursor-pointer content-start gap-1 border-t pt-4 text-left font-semibold text-ink-muted hover:text-ink aria-selected:border-t-2 aria-selected:border-ink aria-selected:pt-[calc(var(--space-4)-1px)] aria-selected:text-ink max-lg:pb-3"
            onClick={() => open(index)}
            onKeyDown={onTabKey}
          >
            <span className={label}>{item.tag}</span>
            {item.title}
          </button>
        ))}
      </div>
      <p className="mb-8 max-w-measure text-ink-muted">{sale.summary}</p>

      <div
        className="grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] items-start gap-8 max-lg:grid-cols-1"
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${sale.id}`}
      >
        <div className="flex h-[560px] flex-col overflow-hidden rounded-md border max-lg:h-[440px]">
          <div className="flex items-center gap-3 border-b bg-surface px-4 py-3">
            <span className="grid size-8 flex-none place-items-center rounded-full bg-ink text-12/6.5 font-semibold text-canvas" aria-hidden="true">
              AI
            </span>
            <div>
              <p className="text-14 font-semibold">{sale.customer}&apos;s AI agent</p>
              <p className="text-12 text-ink-subtle">Any assistant that loads the AIP skill</p>
            </div>
          </div>
          {/* The log scrolls inside the panel. The first entry sits low, so that the chat fills from the bottom. */}
          <ol
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 *:first:mt-auto"
            ref={log}
            role="log"
            aria-live="polite"
            aria-label={`Chat between ${sale.customer} and the AI agent`}
          >
            {entries.length === 0 && (
              <li className="mb-auto self-center text-14/6.5 text-ink-subtle">{sale.customer} hasn&apos;t asked anything yet.</li>
            )}
            {entries.map(({ entry, item, index, order }) => {
              // The entries of the current step come in one after the other.
              const isNew = index === stepIndex;
              const style = isNew ? ({ "--delay": `${(order * ENTRY_DELAY_MS) / 1000}s` } as CSSProperties) : undefined;
              const key = `${sale.id}-${index}-${order}`;
              if (entry.kind === "message") {
                return (
                  <li
                    key={key}
                  data-new={isNew || undefined}
                    className={`max-w-[85%] rounded-md border px-3 py-2 text-15/5.5 ${entry.from === "customer" ? "self-end bg-surface" : "self-start"} ${isNew ? NEW : ""}`}
                    style={style}
                  >
                    <span className="sr-only">{entry.from === "customer" ? sale.customer : "AI agent"}: </span>
                    {entry.text}
                  </li>
                );
              }
              if (entry.kind === "products") {
                // One card for each product: its tiers side by side, with their cover and no price yet, then its conditions and its documents.
                return (
                  <li key={key} data-new={isNew || undefined} className={`grid gap-3 ${isNew ? NEW : ""}`} style={style}>
                    {entry.products.map((product) => (
                      <div key={product.name} className="grid content-start gap-1 rounded-md border px-4 py-3">
                        <p className="text-15/5.5 font-semibold">{product.name}</p>
                        <p className="text-13 text-ink-subtle">{product.summary}</p>
                        <div className="my-2 grid gap-4" style={{ gridTemplateColumns: `repeat(${product.tiers.length}, minmax(0, 1fr))` }}>
                          {product.tiers.map((tier) => (
                            <div key={tier.name}>
                              <p className={label}>{tier.name}</p>
                              <dl className="mt-1 grid text-13">
                                {tier.facts.map(([name, value]) => (
                                  <div key={name} className="flex justify-between gap-3 border-t py-1">
                                    <dt className="text-ink-subtle">{name}</dt>
                                    <dd className="text-right font-medium">{value}</dd>
                                  </div>
                                ))}
                              </dl>
                            </div>
                          ))}
                        </div>
                        <p className={label}>Conditions</p>
                        <ul className="mb-2 grid gap-1 text-13 text-ink-muted">
                          {product.conditions.map((condition) => (
                            <li key={condition}>{condition}</li>
                          ))}
                        </ul>
                        <p className={label}>Documents</p>
                        <p className="text-13 text-ink-muted">{product.documents.join(", ")}</p>
                      </div>
                    ))}
                  </li>
                );
              }
              if (entry.kind === "offers") {
                // One card for each offer, side by side, with the same facts in the same order and no ranking.
                return (
                  <li key={key} data-new={isNew || undefined} className={`grid grid-cols-2 gap-3 ${isNew ? NEW : ""}`} style={style}>
                    {entry.offers.map((offer) => (
                      <div key={`${offer.seller ?? ""}${offer.plan}`} className="grid content-start gap-1 rounded-md border px-4 py-3">
                        {offer.seller && <p className={label}>{offer.seller}</p>}
                        <p className="text-15/5.5 font-semibold">{offer.plan}</p>
                        <p className="text-13 text-ink-subtle">
                          <strong className="text-[20px]/7 font-semibold text-ink">{offer.price}</strong> {offer.period}
                        </p>
                        <dl className="my-2 grid text-13">
                          {offer.facts.map(([name, value]) => (
                            <div key={name} className="flex justify-between gap-3 border-t py-1">
                              <dt className="text-ink-subtle">{name}</dt>
                              <dd className="text-right font-medium">{value}</dd>
                            </div>
                          ))}
                        </dl>
                        <span className={pill()}>Indicative</span>
                      </div>
                    ))}
                  </li>
                );
              }
              // A call of a tool, or what the customer does on the seller's page: one quiet line with an icon.
              return (
                <li
                  key={key}
                  data-new={isNew || undefined}
                  className={`flex items-center gap-2 text-13 ${entry.stop ? "text-critical" : "text-ink-subtle"} ${isNew ? NEW : ""}`}
                  style={style}
                >
                  <CallIcon tool={entry.code} />
                  {callName(entry, item)}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="grid content-start gap-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className={`${label} mr-auto`}>
              Step {stepIndex + 1} of {sale.steps.length}
            </p>
            <div className="flex" role="group" aria-label="Steps">
              {sale.steps.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  className="grid h-7 w-5 cursor-pointer place-items-center before:size-2 before:rounded-full before:border before:border-line-control aria-[current=step]:before:border-ink aria-[current=step]:before:bg-ink"
                  aria-label={`Step ${index + 1}: ${item.title}`}
                  aria-current={index === stepIndex ? "step" : undefined}
                  onClick={() => setStepIndex(index)}
                />
              ))}
            </div>
            <button type="button" className={button({ small: true })} onClick={() => setStepIndex(stepIndex - 1)} disabled={stepIndex === 0}>
              Back
            </button>
            <button type="button" className={button({ small: true, primary: true })} onClick={next}>
              {!last ? "Next" : lastSale ? "First sale" : "Next sale"}
            </button>
          </div>

          <div className="grid content-start gap-2">
            {step.kicker && <p className="text-label text-ink-muted uppercase">{step.kicker}</p>}
            <h3 className="text-title-3">{step.title}</h3>
            <p className="text-ink-muted">{withCode(step.text)}</p>
            {step.checks && (
              // The checks of a step outside the chat, such as the review of a seller.
              <ol className="mt-2 grid list-decimal gap-2 pl-6 text-ink-muted marker:font-mono marker:text-ink-subtle">
                {step.checks.map((check) => (
                  <li key={check}>{withCode(check)}</li>
                ))}
              </ol>
            )}
            {calls.length > 0 && (
              // The details of the calls of the step, which the reader opens.
              <div className="mt-2 grid gap-3">
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-1 justify-self-start text-14/6.5 font-medium text-ink"
                  aria-expanded={details}
                  aria-controls={`${id}-calls`}
                  onClick={() => setDetails(!details)}
                >
                  <svg
                    className={`size-4 fill-none stroke-current stroke-2 transition-transform duration-150 ease-out motion-reduce:transition-none ${details ? "rotate-90" : ""}`}
                    viewBox="0 0 24 24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                  {details ? "Hide the calls" : "Show the calls"}
                </button>
                <ol className="border-t" id={`${id}-calls`} hidden={!details}>
                  {calls.map((call, index) => (
                    <li key={`${stepIndex}-${index}`} className="grid gap-0.5 border-b py-3 text-14/5.5">
                      <p className="flex flex-wrap items-baseline gap-x-3 text-ink">
                        {callName(call, step)}
                        {call.code && (
                          <span className="text-12/5.5 text-ink-subtle">
                            {nameOf(call.from, step)} → {nameOf(call.to, step)}
                          </span>
                        )}
                      </p>
                      <p className={call.stop ? "text-critical" : "text-ink-muted"}>{withCode(call.result)}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <div className={`mt-4 grid grid-cols-2 gap-x-8 gap-y-4 max-sm:grid-cols-1 ${callsOpen ? "" : "border-t pt-4"}`}>
              <div>
                <p className={`${label} mb-1`}>Owner</p>
                <p className="text-ink-muted">{step.owner}</p>
              </div>
              <div>
                <p className={`${label} mb-1`}>Proof</p>
                <p className="text-ink-muted">{step.proof}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
