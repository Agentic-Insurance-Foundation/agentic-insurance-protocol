import { REPO_URL, SCHEMA_HREF, VERSION, repoFileUrl } from "@/lib/site";

// A page whose root has data-flush ends on its own --line border, so the footer
// drops its border and its gap.
export function SiteFooter() {
  return (
    <footer className="mt-24 border-t [body:has([data-gate])_&]:hidden [main:has(>[data-flush])+&]:mt-0 [main:has(>[data-flush])+&]:border-t-0">
      <div className="wrap flex flex-wrap justify-between gap-x-8 gap-y-4 pt-8 pb-12 text-14/5.5 text-ink-subtle">
        <p>
          AIP draft {VERSION}. Licensed under the <a href={repoFileUrl("LICENSE")}>Apache License 2.0</a>. Companies in the examples are fictional.
        </p>
        <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
          <a href={SCHEMA_HREF}>schema.json</a>
          <a href="/llms.txt">llms.txt</a>
          <a href={repoFileUrl("SECURITY.md")}>Security</a>
          <a href={REPO_URL}>GitHub</a>
        </nav>
      </div>
    </footer>
  );
}
