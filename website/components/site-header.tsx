import Link from "next/link";
import { SPEC_HREF } from "@/lib/site";
import { button } from "@/lib/ui";
import { BrandMark } from "./brand-mark";

const NAV_LINK = "rounded-sm px-3 py-2 text-14/6.5 font-medium text-ink-muted no-underline hover:bg-surface hover:text-ink max-lg:hidden";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 h-header border-b bg-canvas [body:has([data-gate])_&]:hidden">
      <div className="wrap flex h-full items-center justify-between gap-4">
        <Link href="/" className="inline-flex min-w-0 items-center gap-3 no-underline" aria-label="AIP home">
          <BrandMark />
          <span className="text-title-4 font-semibold whitespace-nowrap max-sm:hidden">Agentic Insurance Protocol</span>
          <span className="hidden text-title-4 font-semibold whitespace-nowrap max-sm:inline">AIP</span>
        </Link>
        <nav className="flex items-center gap-1" aria-label="Site">
          <Link className={NAV_LINK} href="/#why">
            Why it exists
          </Link>
          <Link className={NAV_LINK} href="/#who">
            Who it&apos;s for
          </Link>
          <Link className={NAV_LINK} href="/#blocks">
            Building blocks
          </Link>
          <Link className={NAV_LINK} href="/#example">
            Example
          </Link>
          <a className={`${button({ primary: true, small: true })} ml-2`} href={SPEC_HREF}>
            Read the spec
          </a>
        </nav>
      </div>
    </header>
  );
}
