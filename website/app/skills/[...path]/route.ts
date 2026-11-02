import { readSkillAsset, skillFiles } from "@/lib/skill-content";

// Each file of skills/, at the same path as in the repository, so that an
// agent or a person can get the skill from the site.

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return skillFiles().map((file) => ({ path: file.split("/") }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path.join("/");
  // The code of the seller template is served as text.
  const type = path.endsWith(".json") ? "application/json" : path.endsWith(".md") ? "text/markdown" : "text/plain";
  return new Response(readSkillAsset(path), { headers: { "Content-Type": `${type}; charset=utf-8` } });
}
