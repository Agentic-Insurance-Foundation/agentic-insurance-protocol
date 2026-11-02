---
name: install-aip-seller-mcp
description: Use this when the user wants to build an MCP server that sells insurance through the Agentic Insurance Protocol (AIP). It starts from a small Express app with the five AIP tools as shells.
---

# Start the MCP server of an insurance seller

`template/` is a small Express app with an MCP server, built with the official MCP TypeScript SDK. `src/server.ts` holds the five tools of AIP draft 0.1 as shells, each with a TODO, and the AIP document at `/.well-known/aip.json`.

1. Copy `template/` to the folder that the user chooses. Run `bun install`, then `bun run dev`. The MCP server is at `http://localhost:3000/mcp`.
2. Ask the user what they sell, and fill each TODO with their data and systems. Before you fill a tool, read its section of the specification at https://docs.agenticinsuranceprotocol.org/0.1/spec, and its types at https://docs.agenticinsuranceprotocol.org/0.1/reference.
3. Keep the tool names and the descriptions. They are the words of the specification.
4. Test it in Claude Code: `claude mcp add --transport http seller http://localhost:3000/mcp`.
