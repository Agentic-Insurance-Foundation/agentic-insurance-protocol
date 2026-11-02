import type { ReactNode } from "react";

// The parts of the home page and the skill page. Each section runs the full
// width of the page and ends on a --line border, and the wrap holds the width
// of the page inside it.

/** The text on the left, narrower than the picture or the panel on the right. One column on narrow screens. */
const halves = "grid grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-16 max-lg:grid-cols-1 max-lg:gap-12";

/** The title of the hero. */
export const heroTitle = "mt-4 mb-6 text-display max-sm:text-[36px]/[42px]";

/** The text under the title of the hero. */
export const lede = "mb-8 max-w-[36rem] text-body-lg text-ink-muted";

/** A row of buttons. */
export const actions = "flex flex-wrap gap-3";

/** Columns: each one opens on an ink rule, with no card around it. */
export function columns(count: 2 | 3) {
  return `grid gap-8 max-lg:grid-cols-1 max-lg:gap-6 ${count === 2 ? "grid-cols-2" : "grid-cols-3"}`;
}

export const column = "grid content-start gap-3 border-t border-ink pt-6";

/** The opening of the page: the text, and beside it the aside. */
export function Hero({ aside, children }: { aside: ReactNode; children: ReactNode }) {
  return (
    <section className="border-b py-24 max-lg:py-16">
      <div className={`wrap items-center ${halves}`}>
        <div>{children}</div>
        {aside}
      </div>
    </section>
  );
}

/** A section. In a split one, the head sits beside the rest. */
export function Section({ id, band = false, split = false, children }: { id: string; band?: boolean; split?: boolean; children: ReactNode }) {
  return (
    <section id={id} className={`border-b pt-16 pb-24 max-sm:pt-12 max-sm:pb-16 ${band ? "bg-surface" : ""}`}>
      <div className={split ? `wrap items-start ${halves}` : "wrap"}>{children}</div>
    </section>
  );
}

/** The title of a section and the paragraphs under it. */
export function SectionHead({ title, split = false, children }: { title: ReactNode; split?: boolean; children?: ReactNode }) {
  return (
    <header className={`grid max-w-measure gap-3 text-17 text-ink-muted ${split ? "" : "mb-12"}`}>
      <h2 className="text-title-2 text-ink">{title}</h2>
      {children}
    </header>
  );
}
