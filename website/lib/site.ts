import { PROTOCOL_VERSION } from "@spec/schema";

export const SITE_URL = "https://agenticinsuranceprotocol.org";
export const SITE_NAME = "Agentic Insurance Protocol";
export const REPO_URL = "https://github.com/Agentic-Insurance-Foundation/agentic-insurance-protocol";

export const VERSION = PROTOCOL_VERSION;
// Mintlify serves the docs of docs/ on their own subdomain, so the site links to
// them with <a>.
export const DOCS_URL = "https://docs.agenticinsuranceprotocol.org";
export const SPEC_HREF = `${DOCS_URL}/${VERSION}/spec`;
export const REGISTRY_HREF = `${DOCS_URL}/${VERSION}/registry`;
export const EVALUATION_HREF = `${DOCS_URL}/${VERSION}/evaluation`;
export const SKILL_HREF = `${DOCS_URL}/${VERSION}/skill`;
export const SCHEMA_HREF = `/schemas/${VERSION}/schema.json`;
export const TOOLS_HREF = `/schemas/${VERSION}/tools.json`;
export const CONTEXT_HREF = "/context";
export const PARTNER_EMAIL = "join-aip@agenticinsuranceprotocol.org";
export const JOIN_HREF = "/join";
export const SUBMIT_HREF = "/submit";

// The install steps that an AI agent reads, in docs/install.mdx: the registry,
// then the MCP server of a seller. /install.md on the site redirects there.
export const INSTALL_HREF = `${DOCS_URL}/install`;

// The heading of the home page, and the line under the name in the image that
// a shared link shows.
export const TAGLINE = "An open protocol to give insurers and regulators control of how AI agents buy insurance.";

// The image that a shared link shows, from `app/og.png/route.tsx`. A page that
// sets its own `openGraph` replaces the one of the layout, so it names the
// image again.
export const OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  type: "image/png",
  alt: `The AIP acorn, the name ${SITE_NAME} and the line "${TAGLINE}"`,
};

export const DESCRIPTION =
  "AI agents already buy insurance for people, outside the rules that every licensed seller follows. AIP proposes one set of rules for the whole market: the AI agent buys only from licensed sellers, under the rules of the customer's country, with a proof of each step. Draft 0.1 covers the US, UK and France.";

export function repoFileUrl(path: string): string {
  return `${REPO_URL}/blob/main/${path}`;
}
