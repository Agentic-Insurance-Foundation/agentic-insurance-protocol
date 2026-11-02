import { readRepoFile } from "@/lib/repo-files";

export const dynamic = "force-static";

// Served at the $id of tools.json.
export function GET() {
  return new Response(readRepoFile("spec/tools.json"), { headers: { "Content-Type": "application/json" } });
}
