// Class lists that several pages share. The theme is in app/globals.css.

/** A button, or a link that looks like one. */
export function button({ primary = false, small = false } = {}) {
  return [
    "inline-flex cursor-pointer items-center gap-2 rounded-md border font-medium no-underline transition-[background-color,border-color] duration-150 ease-out disabled:cursor-default disabled:opacity-40",
    primary
      ? "border-ink bg-ink text-canvas hover:border-ink-muted hover:bg-ink-muted"
      : "border-line-control bg-canvas text-ink hover:border-ink hover:bg-surface",
    small ? "px-3 py-2 text-13/4.5" : "px-4 py-3 text-15/5",
  ].join(" ");
}

/** The small caps above a title, a table or a fact. */
export const label = "text-label text-ink-subtle uppercase";

const PILL_TONES = {
  neutral: "text-ink-subtle",
  positive: "text-positive",
  caution: "text-caution",
  critical: "text-critical",
} as const;

/** A status in a rounded outline, in the colour of its tone. */
export function pill(tone: keyof typeof PILL_TONES = "neutral") {
  return `inline-flex items-center gap-2 justify-self-start rounded-full border border-current px-2 py-0.5 text-label uppercase ${PILL_TONES[tone]}`;
}

/** A form field: a label above its control. */
export const field = "grid w-full gap-2";

/** Two fields side by side, one above the other on a narrow screen. */
export const fieldRow = "grid w-full grid-cols-2 gap-4 max-sm:grid-cols-1";

export const fieldLabel = "text-14 font-medium";
export const fieldHint = "font-normal text-ink-subtle";
export const fieldNote = "text-14 text-ink-subtle";

/** An input, a select or a textarea. A required select keeps the colour of a hint until the visitor picks an item. */
export const control =
  "w-full rounded-md border border-line-control bg-canvas p-3 text-ink aria-invalid:border-critical [&:is(select):invalid]:text-ink-subtle [&_option]:text-ink";

export const formError = "text-14 text-critical";
