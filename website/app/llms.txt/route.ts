import {
  DESCRIPTION,
  DOCS_URL,
  INSTALL_HREF,
  REGISTRY_HREF,
  REPO_URL,
  SCHEMA_HREF,
  SITE_NAME,
  SITE_URL,
  SKILL_HREF,
  SPEC_HREF,
  TOOLS_HREF,
} from "@/lib/site";
import { countryFiles, GUIDELINES_FILE_PATH, SKILL_FILE_PATH } from "@/lib/skill-content";

export const dynamic = "force-static";

// Mintlify writes the llms.txt of the docs, and serves each page of the docs
// as Markdown at its address with .md. This one sends an AI agent from the site
// to the docs, and lists the files that only the site serves.
export function GET() {
  const body = [
    `# ${SITE_NAME} (AIP)`,
    "",
    `> ${DESCRIPTION}`,
    "",
    "## Docs",
    "",
    `- [Docs index](${DOCS_URL}/llms.txt): Each page of the docs, as Markdown`,
    `- [Install](${INSTALL_HREF}.md): Install the AIP skill and the registry to buy insurance, or build the MCP server of a seller`,
    `- [Specification](${SPEC_HREF}.md): The tools of a seller, the flow of a sale and the evidence it leaves`,
    `- [Registry](${REGISTRY_HREF}.md): How the registry lists sellers and checks licences in the public registers`,
    `- [AIP skill](${SKILL_HREF}.md): The procedure that an AI agent follows to buy insurance, and the rules of each country`,
    "",
    "## Skill files",
    "",
    `- [SKILL.md](${SITE_URL}/${SKILL_FILE_PATH}): When an agent uses the skill, and which files it loads`,
    `- [guidelines.md](${SITE_URL}/${GUIDELINES_FILE_PATH}): The procedure that an agent follows to buy insurance with AIP`,
    ...countryFiles().flatMap((file) => [
      `- [${file.name}](${SITE_URL}/skills/${file.path}): Rules file of ${file.name}, version ${file.version}, ${file.status}`,
      ...file.extraFiles.map((extra) => `- [${extra.name}](${SITE_URL}/skills/${extra.path}): Rules file, version ${extra.version}, ${extra.status}`),
    ]),
    "",
    "## Source",
    "",
    `- [schema.json](${SITE_URL}${SCHEMA_HREF}): JSON Schema of every AIP type, generated from schema.ts`,
    `- [tools.json](${SITE_URL}${TOOLS_HREF}): the MCP definition of each tool, with its input and output schemas`,
    `- [Repository](${REPO_URL}): schema.ts, worked example and checks`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
