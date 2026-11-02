// A bare MCP server for an insurance seller, with the five tools of the
// Agentic Insurance Protocol (AIP), draft 0.1. Each tool is a shell: replace
// each TODO with your own data and systems. The specification gives the rules
// and the types of each tool: https://docs.agenticinsuranceprotocol.org/0.1/spec
import { toNodeHandler } from "@modelcontextprotocol/node";
import { McpServer, createMcpHandler, type CallToolResult } from "@modelcontextprotocol/server";
import express from "express";
import { z } from "zod";

const PORT = Number(process.env.PORT ?? 3000);
const PUBLIC_URL = process.env.PUBLIC_URL ?? `http://localhost:${PORT}`;
const DOMAIN = new URL(PUBLIC_URL).hostname;

// TODO: your level (1 lists, 2 quotes, 3 takes applications), your lines and your countries.
const AIP = { version: "0.1", conformance_level: 3, lines: ["pet"], countries: ["FR"] };

/** The data in `structuredContent`, and the same JSON in `content` for hosts that show only `content`. */
function ok(data: object): CallToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: data as Record<string, unknown> };
}

function fail(code: string, message: string): CallToolResult {
  const error = { code, message, retryable: false };
  return { content: [{ type: "text", text: JSON.stringify({ error }) }], structuredContent: { error }, isError: true };
}

function createServer(): McpServer {
  const server = new McpServer(
    { name: "aip-seller", version: "0.1.0" },
    { capabilities: { tools: {}, extensions: { "org.agenticinsuranceprotocol/aip": AIP } } },
  );

  server.registerTool(
    "get_distributor",
    {
      description:
        "Who sells: the legal name, the domain, the licences and the AIP settings of this seller. The licences are a claim. Check them with the AIP registry.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    () =>
      // TODO: your company and your licences.
      ok({
        legal_name: "Example Broker SAS",
        domain: DOMAIN,
        roles: ["broker"],
        licences: [{ country: "FR", regulator: "ACPR", register: "ORIAS", identifier_type: "orias_number", identifier: "00000000", role: "broker" }],
        countries: ["FR"],
        aip: AIP,
      }),
  );

  server.registerTool(
    "list_products",
    {
      description:
        "The products, each with its underwriting scope, its tiers and its documents, and no price. Filter by country, subdivision, line, insured family and kind. Read the conditions of the scope before you ask the customer any question.",
      inputSchema: z.object({
        country: z.string().optional(),
        subdivision: z.string().optional(),
        line: z.string().optional(),
        insured_family: z.string().optional(),
        insured_kind: z.string().optional(),
        language: z.string().optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    () =>
      // TODO: your products that match the filters.
      ok({ products: [] }),
  );

  server.registerTool(
    "quote",
    {
      description:
        "Price a product. Send all the answers you have, each with its source, even none. When answers are missing, the result gives the questions as a JSON Schema and the missing answers. Otherwise it gives the offers, or the reason for no offer. The price of an offer can change after the insurer's checks.",
      inputSchema: z.object({
        product_id: z.string(),
        answers: z.record(z.string(), z.unknown()),
        answer_sources: z.record(z.string(), z.unknown()),
        options: z.array(z.string()).optional(),
        language: z.string().optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    () =>
      // TODO: the questions that are missing, or one offer for each tier, from your rating.
      // Keep the answers and their sources with each offer, for submit_application.
      fail("product_not_found", "This server has no product yet."),
  );

  server.registerTool(
    "submit_application",
    {
      description:
        "Apply for an offer of a complete quote. The server takes the answers and their sources from that quote. Returns the page where the customer checks the answers, reads the documents and approves, then signs and pays. Only the customer can approve.",
      inputSchema: z.object({
        offer_id: z.string(),
        parties: z.array(z.record(z.string(), z.unknown())),
        language: z.string().optional(),
      }),
    },
    () =>
      // TODO: the application_id, a random application_key, the summary, the URL of
      // your approval page with its own random token, and expires_at.
      fail("offer_not_found", "No offer has this offer_id."),
  );

  server.registerTool(
    "get_operation",
    {
      description:
        "Read where an application of this server is: waiting for the customer, approved, refused or expired. Send the application_id and the application_key of submit_application.",
      inputSchema: z.object({ application_id: z.string(), application_key: z.string() }),
      annotations: { readOnlyHint: true },
    },
    () =>
      // TODO: the state of the application: waiting, approved, refused or expired.
      fail("application_not_found", "No application has this application_id with this application_key."),
  );

  return server;
}

const app = express();
app.use(express.json());

const mcp = toNodeHandler(createMcpHandler(createServer));
app.all("/mcp", (req, res) => void mcp(req, res, req.body));

// The registry reads this document to find your MCP server from your domain.
app.get("/.well-known/aip.json", (_req, res) => {
  res.json({ domain: DOMAIN, mcp_url: `${PUBLIC_URL}/mcp`, aip: AIP });
});

app.listen(PORT, () => console.log(`MCP server on ${PUBLIC_URL}/mcp`));
