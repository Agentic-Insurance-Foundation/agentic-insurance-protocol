import type { MetadataRoute } from "next";
import { CONTEXT_HREF, JOIN_HREF, SITE_URL, SUBMIT_HREF } from "@/lib/site";

export const dynamic = "force-static";

// The pages of the site. Mintlify lists the pages of the docs in its own
// sitemap, under /docs.
export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", CONTEXT_HREF, JOIN_HREF, SUBMIT_HREF].map((href) => ({ url: `${SITE_URL}${href}` }));
}
