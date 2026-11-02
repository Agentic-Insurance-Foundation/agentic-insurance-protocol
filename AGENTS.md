# Agentic Insurance Protocol

## Layout

`spec/` holds the protocol: the types, the schemas and the worked example. `docs/` holds the docs, a Mintlify site with the text of the specification, and the section "Docs" below gives its rules. `skills/` holds the AIP skill, and `install-aip-seller-mcp`, the skill that builds the MCP server of a seller from its template. `scripts/` generates and checks what `spec/`, `docs/` and `skills/` hold. `website/` is the website, and `website/AGENTS.md` gives its rules. `registry/` is the AIP registry, an MCP server. The website, the registry and the seller template are bun workspaces of the root package, with one `bun.lock`.

## Source of truth

`spec/schema.ts` holds every type of the seller tools and its rules, in RFC 2119 keywords. The registry server is the source of truth of the registry: `registry/src/schema.ts` defines each registry type as a zod schema, and the registry tools. `docs/0.1/registry.mdx` gives the rules. The server checks each call and each result with these schemas, and lists its tools from them. `spec/registry.ts` exports them again for the spec, the site and the scripts. `scripts/generate.ts` generates `spec/schema.json` from `spec/schema.ts` and `registry/src/schema.ts`, and `spec/tools.json`, the MCP definition of each tool. Its registry part is what the registry gives in `tools/list`. `scripts/examples.ts` writes the worked flow in `spec/examples/`. `registry/scripts/generate.ts` writes `registry/src/generated/rules-files.ts` from the country files of the skill, and `registry/public/` from the mark, the tokens and the fonts of the website. `scripts/docs.ts` writes the schema reference `docs/0.1/reference.mdx`, the page of each country file in `docs/0.1/skill/`, the tables and lists in `docs/snippets/generated/`, the JSON of each example in `docs/snippets/examples/`, and `docs/favicon.svg`. Don't edit `schema.json`, `tools.json`, `examples/`, these registry files or these docs files by hand.

## Checks

After a change, run `bun run check` and commit what it writes. It type-checks the schema, the scripts, the website, the registry and the seller template (each example in `scripts/examples.ts` has its schema type), regenerates `schema.json`, `tools.json`, the examples, the registry files and the generated docs, validates the examples against both, runs the rule checks in `scripts/validate.ts`, and checks the docs with `mint validate` and `mint broken-links`. CI fails when `spec/schema.json`, `spec/tools.json`, `spec/examples/`, the generated registry files or the generated docs differ from what the scripts write.

When you add a MUST rule that a JSON Schema cannot express, add a check for it in `scripts/validate.ts` and list it in the section "Checks" of its page in the docs: the specification, the registry or the AIP skill.

## Docs

`docs/` is a Mintlify site. `docs/docs.json` sets its look and its navigation, and lists every page. `docs/style.css` does what `docs.json` cannot: the header, the sections of a tab with one page in the left column, and the tag of the draft above each page of a draft. Add a tag rule there for each new draft. `bun run docs` previews it at http://localhost:3000. The introduction, the install steps, the specification, the registry, the AIP skill, the evaluation and the worked example are MDX written by hand, in `docs/introduction.mdx`, `docs/install.mdx` and `docs/0.1/`. A script generates only what comes from the source: the types, the examples and the files of the skill. It copies no text from a README. A page imports a generated table or the JSON of an example from `docs/snippets/`, and shows it as a component, for example `<Levels />`.

MDX reads `{`, `}` and `<` as code, so escape them in prose, and write a comment as `{/* … */}`, never as an HTML comment. A link starts from the root of the docs, with no `/docs` and no extension, for example `/0.1/registry#6-4-verdict`. Mintlify keeps the number of a section in its anchor. A type name in inline code links to its definition, for example ``[`Offer`](/0.1/reference#offer)``. `scripts/docs.ts` fails on inline code that names a type `schema.json` does not define, and when `docs.json` leaves a page out. `docs/logo/` holds the mark and the name, set in IBM Plex Sans SemiBold and turned into paths. Draw it again when the mark changes.

The docs are public, at docs.agenticinsuranceprotocol.org. Mintlify builds them on each push to `main`, from `docs.json` in the subdirectory `/docs`. Put each text that a person or an AI agent reads in the docs, and link to it from the website. Mintlify serves pages only, so `schema.json`, `tools.json` and the files of the skill stay on the website, in `/schemas/` and `/skills/`, and the docs link to them there.

## Registry

`registry/` runs on Node 24 on Vercel, from the Root Directory `registry`. `registry/src/` holds the server, with one file for each tool in `src/tools/`. `bun run dev` in `registry/` runs `src/index.ts` on your machine, and on Vercel the platform calls the app that it exports. Keep Bun APIs out of `registry/src/`. Vercel compiles each file of the registry on its own and keeps each import as written, so an alias such as `@spec/` passes on Bun and fails on Vercel. The registry imports nothing from outside `registry/`, and its `tsconfig.json` defines no alias, so `tsc` refuses one. Production serves no fictional data. `TEST_DATA=1` turns on the entries of `registry/src/data/test-data.ts`, and `bun run dev` sets it. Don't set it on Vercel.

## Seller template

`skills/install-aip-seller-mcp/template/` is a small Express app with an MCP server, which a seller copies out of this repository. `src/server.ts` holds the five seller tools as shells. Keep it small, and keep its tool names and descriptions the same as in `spec/schema.ts`.

## Imports

Import the spec with the `@spec/` alias, for example `@spec/schema` or `@spec/schema.json`. The root and the website both define it, so a file that both compile resolves it the same way. The registry is the exception, for the reason above. For the rest, `@/` points to the root of the repository in the scripts, and to `website/` in the website, for example `@/lib/site`. Use `./` only for a file in the same folder.

## Names

Don't name a real company anywhere in the specification, the comments or the examples, and don't copy a company's tool names. This applies also when its server or API is public. Describe a source by its line, and by its country when it is one of the three countries of draft 0.1, for example "a pet insurer (FR)". The examples use fictional companies on `example.com`. The figures and the news on the home page follow the same rule: describe the company, for example "an online insurance marketplace", and link the source. The explainer video follows it too. Two sections of the home page are the exception: "Why it exists" names the AI agents and the companies of the press release, and "Launch partners" shows the logos of the partners. You can name public specifications (MCP, PAP, RFC 2119), laws (IDD) and public registers and regulators (ORIAS, ACPR, FCA).

## Writing

The README and the doc comments use short sentences and plain words. Use the RFC 2119 keywords in capitals only for rules.
