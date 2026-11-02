import type { Metadata } from "next";
import Link from "next/link";
import { Figures, News } from "@/components/context";
import { SPEC_HREF } from "@/lib/site";
import { button } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Context",
  description: "How fast AI agent traffic grows, and how insurers, marketplaces and banks reacted in September and October 2026.",
  alternates: { canonical: "/context" },
};

export default function Context() {
  return (
    <div className="wrap">
      <header className="grid max-w-measure gap-4 pt-16 pb-8 text-ink-muted">
        <p className="text-label uppercase">Context</p>
        <h1 className="text-title-1 text-ink max-sm:text-title-2">AI agents have started to buy</h1>
        <p className="text-body-lg">
          AI agents now search, compare and buy for people, insurance included, and their traffic grows faster than human traffic. Insurance is a
          regulated market. No rule covers an AI agent yet, so each company decides alone how to answer: it blocks AI agents, lets them in, or writes
          its own rules. Each figure and each news item links to its source.
        </p>
      </header>
      <Figures />
      <News />
      <div className="mt-12 flex flex-wrap gap-3">
        <Link className={button({ primary: true })} href="/">
          Back to the home page
        </Link>
        <a className={button()} href={SPEC_HREF}>
          Read the spec
        </a>
      </div>
    </div>
  );
}
