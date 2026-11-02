import type { Metadata } from "next";
import Link from "next/link";
import { SPEC_HREF } from "@/lib/site";
import { button, label } from "@/lib/ui";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="wrap grid gap-4 pt-24">
      <p className={label}>404</p>
      <h1 className="text-title-1 max-sm:text-title-2">This page does not exist.</h1>
      <div className="flex flex-wrap gap-3">
        <a className={button({ primary: true })} href={SPEC_HREF}>
          Read the spec
        </a>
        <Link className={button()} href="/">
          Home
        </Link>
      </div>
    </div>
  );
}
