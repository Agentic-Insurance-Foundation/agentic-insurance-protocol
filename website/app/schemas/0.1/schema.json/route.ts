import { readRepoFile } from "@/lib/repo-files";

export const dynamic = "force-static";

// Served at the $id of schema.json.
export function GET() {
  return new Response(readRepoFile("spec/schema.json"), { headers: { "Content-Type": "application/schema+json" } });
}
