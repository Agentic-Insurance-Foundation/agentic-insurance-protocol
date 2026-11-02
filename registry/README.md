# AIP registry

The registry of the [Agentic Insurance Protocol](https://agenticinsuranceprotocol.org) (AIP). It is one MCP server, at `https://registry.agenticinsuranceprotocol.org/mcp`, that an AI agent calls before it sends anything to an insurance seller. It never gets customer data.

| Tool | What it answers |
|---|---|
| `search_distributors` | Which sellers speak AIP in this country? Each one comes with a licence check |
| `verify_licence` | Does this seller, or the insurer behind an offer, hold an active licence for this country and line? |
| `get_country_rules` | Which rules does an AI agent follow in this country? |

[`src/schema.ts`](src/schema.ts) defines the tools and their types, in zod. The server checks each call and each result with it, and lists each tool from it. `bun run check` at the root copies it into [`spec/schema.json`](../spec/schema.json) and [`spec/tools.json`](../spec/tools.json). [`docs/0.1/registry.mdx`](../docs/0.1/registry.mdx) gives the rules.

## Status

The registry lists no server and reads no register yet. So in production, `search_distributors` gives the error `country_not_covered`, `verify_licence` gives the verdict `unknown`, and `get_country_rules` gives the country files of the skill.

`TEST_DATA=1` turns on the fictional companies of `src/data/test-data.ts`. `bun run dev` sets it. Don't set it on Vercel.

## Run it

Run `bun install` at the root of the repository. Then, in `registry/`:

| Command | Address | Test data |
|---|---|---|
| `bun run dev` | `http://localhost:3000/mcp` | Yes |
| `bun src/index.ts` | `http://localhost:3000/mcp`, as in production | No |

## Code

The server uses Express and v2 of the official MCP TypeScript SDK. It keeps no session, so any instance can answer any request.

```
src/index.ts        the routes: /mcp, the rules files under /rules/, and the page at /
src/schema.ts       the types and the tools, in zod
src/mcp.ts          the MCP server: it registers each tool with its zod schemas
src/home.ts         the page at /
src/config.ts       the environment variables
src/tools/          the handler of each tool
src/data/           what the registry serves: nothing in production, the test data with TEST_DATA=1
src/generated/      the rules files of the skill, written by scripts/generate.ts
public/             written by scripts/generate.ts: the mark, the icons, the tokens and the fonts
```

Vercel runs the Express app that `src/index.ts` exports, on Node 24, with `registry` as the Root Directory. Its CDN serves `public/`.

The registry imports nothing from outside `registry/`. Vercel keeps each import as written, so an alias such as `@spec/` would fail there.

After a change in `src/schema.ts` or the skill, run `bun run check` at the root and commit what it writes. A rules file served here must be the same text as the file of the skill (rule RG9).
