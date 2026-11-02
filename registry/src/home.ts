import type { RegistryToolName } from "./schema.js";
import { LISTING_URL, SPEC_URL, TEST_DATA, publicUrl } from "./config.js";
import { SOURCES } from "./data/index.js";
import { RULES_FILES } from "./generated/rules-files.js";
import { frontMatter } from "./tools/get-country-rules.js";

const COUNTRIES: Record<string, string> = { US: "United States", GB: "United Kingdom", FR: "France" };

/** What each tool does, for a person. The description in tools.json is for the AI agent. */
const TOOLS: Record<RegistryToolName, string> = {
  search_distributors: "Finds the sellers that speak AIP in a country, each with a licence check.",
  verify_licence: "Checks in the public registers that a seller or an insurer holds a licence.",
  get_country_rules: "Gives the rules that an AI agent follows in a country.",
};

function escape(text: string): string {
  return text.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char] ?? char);
}

const style = `
@font-face { font-family: "IBM Plex Sans"; src: url("/fonts/IBMPlexSans-Variable.woff2") format("woff2"); font-weight: 100 700; font-display: swap; }
@font-face { font-family: "IBM Plex Mono"; src: url("/fonts/IBMPlexMono-Regular.woff2") format("woff2"); font-weight: 400; font-display: swap; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--canvas); color: var(--ink); font: 16px/1.6 "IBM Plex Sans", system-ui, sans-serif; }
main { max-width: var(--width-measure); margin: 0 auto; padding: var(--space-12) var(--space-4) var(--space-16); }
header { display: flex; align-items: center; gap: var(--space-3); }
header img { display: block; flex: none; }
h1 { margin: 0; font-size: 24px; line-height: 32px; font-weight: 600; }
h2 { margin: var(--space-12) 0 var(--space-3); font-size: 16px; font-weight: 600; }
p { margin: var(--space-4) 0 0; color: var(--ink-muted); }
h2 + p { margin: 0 0 var(--space-4); }
a { color: var(--ink); }
code { font: 14px/1.5 "IBM Plex Mono", ui-monospace, monospace; }
.status { display: inline-flex; align-items: center; gap: var(--space-2); margin-top: var(--space-6); padding: var(--space-1) var(--space-3); border: 1px solid var(--line); border-radius: var(--radius-full); font-size: 14px; color: var(--ink-muted); }
.status::before { content: ""; width: 8px; height: 8px; border-radius: var(--radius-full); background: var(--accent); }
.endpoint { display: block; padding: var(--space-3) var(--space-4); background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-md); overflow-wrap: anywhere; }
dl { margin: 0; border-top: 1px solid var(--line); }
dl > div { padding: var(--space-3) 0; border-bottom: 1px solid var(--line); }
dt code { font-weight: 500; }
dd { margin: var(--space-1) 0 0; color: var(--ink-muted); }
ul { margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--line); }
li { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--space-1) var(--space-4); padding: var(--space-3) 0; border-bottom: 1px solid var(--line); }
li span { color: var(--ink-subtle); font-size: 14px; }
`;

export function homePage(): string {
  const tools = Object.entries(TOOLS)
    .map(([name, text]) => `<div><dt><code>${name}</code></dt><dd>${escape(text)}</dd></div>`)
    .join("");
  const rules = Object.entries(RULES_FILES)
    .map(([path, content]) => {
      const meta = frontMatter(content);
      const country = COUNTRIES[meta.country ?? ""] ?? meta.country ?? "";
      const name = meta.line ? `${country}, ${meta.line} insurance` : country;
      return `<li><a href="/rules/${escape(path)}">${escape(name)}</a><span>${escape(meta.status ?? "")}, version ${escape(meta.version ?? "")}</span></li>`;
    })
    .join("");
  const registers = SOURCES.map(
    (source) => `<li><a href="${escape(source.url)}">${escape(source.register)}</a><span>${escape(source.regulator)}, ${escape(source.country)}</span></li>`,
  ).join("");
  const status = TEST_DATA ? "Test data. Every server and register entry here is fictional." : "Draft 0.1. The registry lists no server and reads no register yet.";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AIP registry</title>
<meta name="description" content="The registry of the Agentic Insurance Protocol: find the sellers that speak AIP, check a licence, load the rules of a country.">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0a1322">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/aip-mark.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/fonts/IBMPlexSans-Variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/tokens.css">
<style>${style}</style>
</head>
<body>
<main>
<header><img src="/aip-mark.svg" width="40" height="40" alt=""><h1>AIP registry</h1></header>
<p>The registry of the <a href="https://agenticinsuranceprotocol.org">Agentic Insurance Protocol</a>. An AI agent calls it before it sends anything to an insurance seller. It never gets customer data.</p>
<div class="status">${status}</div>

<h2>MCP endpoint</h2>
<p>Streamable HTTP, with no sign-in.</p>
<code class="endpoint">${escape(publicUrl())}/mcp</code>

<h2>Tools</h2>
<dl>${tools}</dl>
<p>The <a href="${SPEC_URL}">registry spec</a> defines each tool.</p>

<h2>Country rules</h2>
<p>The country files of the AIP skill, unchanged.</p>
<ul>${rules}</ul>
${TEST_DATA ? `
<h2>Registers</h2>
<p>The public registers where the registry checks a licence. With the test data, it reads none of them and serves fictional entries.</p>
<ul>${registers}</ul>
` : ""}
<h2>Submit your server</h2>
<p>An insurer or a distributor submits its MCP server on the <a href="${LISTING_URL}">AIP site</a>. The site checks the server and its tools, and the AIP maintainers check each licence in its public register.</p>
</main>
</body>
</html>
`;
}
