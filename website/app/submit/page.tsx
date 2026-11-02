import type { Metadata } from "next";
import { ListingForm } from "@/components/listing-form";
import { SUBMIT_HREF } from "@/lib/site";

export const metadata: Metadata = {
  title: "Submit your server to the registry",
  description: "Ask the AIP registry to list your MCP server. The page checks your aip.json, the server and its tools, and we check each licence in its public register.",
  alternates: { canonical: SUBMIT_HREF },
};

// One column, with a bar of the steps of the request and the panel of the
// current step under it.
export default function Submit() {
  return (
    <div className="wrap">
      <div className="mx-auto grid max-w-measure gap-8 pt-16">
        <header className="grid gap-2">
          <h1 className="text-title-1 max-sm:text-title-2">Submit your server to the registry</h1>
          <p className="text-ink-muted">We check your server here, and your licences by hand.</p>
        </header>
        <ListingForm />
      </div>
    </div>
  );
}
