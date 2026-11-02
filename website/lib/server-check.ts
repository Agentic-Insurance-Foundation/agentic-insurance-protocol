import Ajv, { type ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import type { CheckId, CheckStep, Distributor, ServerCheck } from "@/lib/listings";
import { type FetchFailure, type FetchResult, isAllowedUrl, safeFetch } from "@/lib/safe-fetch";
import { EXTENSION_ID, PROTOCOL_VERSION, TOOLS, type GetDistributorResult, type ListProductsResult, type ToolName } from "@spec/schema";
import schema from "@spec/schema.json";

// Steps 2, 3 and 5 of section 8.1 of the registry spec, for the /submit form:
// read the aip.json of the domain, call get_distributor on the MCP server that
// it names, and check the tools of the level and the results of the level 1
// tools. Step 4, the licences in their registers, stays with the operator.
// Each failure says what to fix, and never shows a body or an error text that
// the server returned.

const ajv = new Ajv({ allErrors: false, strict: false });
addFormats(ajv);
ajv.addSchema(schema, "aip");

const AIP_JSON_BYTES = 64 * 1024;
const MCP_BYTES = 1024 * 1024;
const TIMEOUT_MS = 8000;
const MCP_PROTOCOL_VERSION = "2025-11-25";

const HOST = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,63}$/;

// The domain in what the seller writes: a domain, a website or the address of
// its aip.json or of its MCP server.
export function domainOf(input: string): string | null {
  const text = input.trim().toLowerCase();
  if (!text) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//.test(text) ? text : `https://${text}`);
    return HOST.test(url.hostname) ? url.hostname : null;
  } catch {
    return null;
  }
}

class CheckFailed extends Error {}

function fetchFailure(failure: FetchFailure, host: string): string {
  switch (failure) {
    case "not_https":
      return "The address must use HTTPS on port 443, on a host name.";
    case "private_address":
      return `${host} has an address that is not public.`;
    case "unreachable":
      return `We could not connect to ${host} over HTTPS.`;
    case "timeout":
      return `${host} did not answer within ${TIMEOUT_MS / 1000} seconds.`;
    case "too_large":
      return "The response is too large.";
    case "redirect":
      return "The address redirects to another host.";
  }
}

function schemaError(errors: ErrorObject[] | null | undefined): string {
  const [error] = errors ?? [];
  if (!error) return "";
  return error.instancePath ? `${error.instancePath} ${error.message}` : `${error.message}`;
}

// Throws when the value does not match the definition of schema.json.
function expectSchema(definition: string, value: unknown, what: string): void {
  const validate = ajv.getSchema(`aip#/definitions/${definition}`);
  if (!validate) throw new Error(`schema.json has no definition ${definition}`);
  if (!validate(value)) throw new CheckFailed(`${what} does not match ${definition}: ${schemaError(validate.errors)}.`);
}

type JsonRpcMessage = { id?: unknown; result?: unknown; error?: unknown };

// The JSON-RPC messages of a body, as JSON or as server-sent events.
function messages(body: string, contentType: string): JsonRpcMessage[] {
  const parse = (text: string): JsonRpcMessage[] => {
    try {
      const value: unknown = JSON.parse(text);
      return (Array.isArray(value) ? value : [value]).filter((item): item is JsonRpcMessage => typeof item === "object" && item !== null);
    } catch {
      return [];
    }
  };
  if (!contentType.includes("text/event-stream")) return parse(body);
  return body
    .split(/\r?\n\r?\n/)
    .map((event) =>
      event
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n"),
    )
    .filter(Boolean)
    .flatMap(parse);
}

// A client of the MCP Streamable HTTP transport, with only what the checks need.
class McpClient {
  private nextId = 1;
  private sessionId: string | undefined;
  private protocolVersion: string | undefined;
  private readonly host: string;

  constructor(private readonly url: string) {
    this.host = new URL(url).hostname;
  }

  private headers(): Record<string, string> {
    return {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      ...(this.protocolVersion ? { "mcp-protocol-version": this.protocolVersion } : {}),
      ...(this.sessionId ? { "mcp-session-id": this.sessionId } : {}),
    };
  }

  private async post(body: object, done?: (body: string) => boolean): Promise<FetchResult & { ok: true }> {
    const result = await safeFetch(this.url, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
      maxBytes: MCP_BYTES,
      timeoutMs: TIMEOUT_MS,
      ...(done ? { done } : {}),
    });
    if (!result.ok) throw new CheckFailed(fetchFailure(result.failure, this.host));
    return result;
  }

  async request(method: string, params: object): Promise<unknown> {
    const id = this.nextId++;
    const found = (body: string, type: string) => messages(body, type).find((message) => message.id === id);
    const response = await this.post({ jsonrpc: "2.0", id, method, params }, (body) => found(body, "text/event-stream") !== undefined);
    if (response.status !== 200) throw new CheckFailed(`The server answered ${method} with HTTP ${response.status}.`);
    const message = found(response.body, String(response.headers["content-type"] ?? ""));
    if (!message) throw new CheckFailed(`The server gave no JSON-RPC answer to ${method}.`);
    if (message.error !== undefined || message.result === undefined) throw new CheckFailed(`The server returned a JSON-RPC error to ${method}.`);
    const sessionId = response.headers["mcp-session-id"];
    if (method === "initialize" && typeof sessionId === "string") this.sessionId = sessionId;
    return message.result;
  }

  async initialize(): Promise<void> {
    const result = (await this.request("initialize", {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: { extensions: { [EXTENSION_ID]: { version: PROTOCOL_VERSION } } },
      clientInfo: { name: "aip-registry-check", version: PROTOCOL_VERSION },
    })) as { protocolVersion?: unknown };
    this.protocolVersion = typeof result.protocolVersion === "string" ? result.protocolVersion : MCP_PROTOCOL_VERSION;
    await this.post({ jsonrpc: "2.0", method: "notifications/initialized" });
  }

  async toolNames(): Promise<Set<string>> {
    const names = new Set<string>();
    let cursor: string | undefined;
    for (let page = 0; page < 10; page++) {
      const result = (await this.request("tools/list", cursor ? { cursor } : {})) as { tools?: { name?: unknown }[]; nextCursor?: unknown };
      for (const tool of result.tools ?? []) if (typeof tool.name === "string") names.add(tool.name);
      if (typeof result.nextCursor !== "string") break;
      cursor = result.nextCursor;
    }
    return names;
  }

  // The structuredContent of a tool result. A result with isError fails the check.
  async callTool(name: ToolName, args: object): Promise<unknown> {
    const result = (await this.request("tools/call", { name, arguments: args })) as { isError?: unknown; structuredContent?: unknown };
    if (result.isError === true) throw new CheckFailed(`${name} returned an error.`);
    if (typeof result.structuredContent !== "object" || result.structuredContent === null) {
      throw new CheckFailed(`${name} returned no structuredContent.`);
    }
    return result.structuredContent;
  }
}

// The tools that a level needs: every tool of that level and of the levels below it.
function missingTools(level: number, names: Set<string>): string[] {
  return (Object.keys(TOOLS) as ToolName[]).filter((name) => TOOLS[name].level <= level && !names.has(name));
}

type StepResult = { detail: string };

// Runs the checks in order. A check runs only when the one before it passed.
export async function checkServer(input: string): Promise<ServerCheck> {
  const domain = domainOf(input);
  if (!domain) return { status: "invalid", message: "Enter a domain, such as pets.example.com." };

  const aipJsonUrl = `https://${domain}/.well-known/aip.json`;
  let mcp: McpClient | undefined;
  let distributor: Distributor | null = null;
  let level = 0;

  const run: [CheckId, () => string, () => Promise<StepResult>][] = [
    [
      "aip_json",
      () => "Your aip.json",
      async () => {
        const response = await safeFetch(aipJsonUrl, { headers: { accept: "application/json" }, maxBytes: AIP_JSON_BYTES, timeoutMs: TIMEOUT_MS });
        if (!response.ok) throw new CheckFailed(fetchFailure(response.failure, domain));
        if (response.status !== 200) throw new CheckFailed(`${aipJsonUrl} answered with HTTP ${response.status}.`);
        let document: unknown;
        try {
          document = JSON.parse(response.body);
        } catch {
          throw new CheckFailed(`${aipJsonUrl} is not valid JSON.`);
        }
        expectSchema("AipDocument", document, "The document");
        const { domain: declared, mcp_url } = document as { domain: string; mcp_url: string };
        if (declared !== domain) throw new CheckFailed(`The domain field of the document is not ${domain}.`);
        if (!URL.canParse(mcp_url) || !isAllowedUrl(new URL(mcp_url))) throw new CheckFailed("Its mcp_url must use HTTPS on port 443, on a host name.");
        mcp = new McpClient(mcp_url);
        return { detail: `${aipJsonUrl} names your MCP server.` };
      },
    ],
    [
      "mcp_server",
      () => "Your MCP server",
      async () => {
        if (!mcp) throw new Error("The aip.json check did not run.");
        await mcp.initialize();
        const result = await mcp.callTool("get_distributor", {});
        expectSchema("GetDistributorResult", result, "The result of get_distributor");
        const found = result as GetDistributorResult;
        if (found.domain !== domain) throw new CheckFailed(`The domain of get_distributor is not ${domain}.`);
        level = found.aip.conformance_level;
        distributor = {
          legalName: found.legal_name,
          roles: found.roles,
          countries: found.countries,
          level,
          licences: found.licences.map(({ country, regulator, register, identifier, role }) => ({ country, regulator, register, identifier, role })),
        };
        return { detail: `get_distributor answers for ${domain}.` };
      },
    ],
    [
      "tools",
      () => (level ? `The tools of level ${level}` : "The tools of your level"),
      async () => {
        if (!mcp) throw new Error("The aip.json check did not run.");
        const missing = missingTools(level, await mcp.toolNames());
        if (missing.length > 0) throw new CheckFailed(`Missing for level ${level}: ${missing.join(", ")}.`);
        const products = await mcp.callTool("list_products", {});
        expectSchema("ListProductsResult", products, "The result of list_products");
        // The schema requires the documents of each product, so this check covers them.
        if ((products as ListProductsResult).products.length === 0) {
          return { detail: `Every tool of level ${level} is there, and list_products gives a valid result. It lists no product yet.` };
        }
        return { detail: `Every tool of level ${level} is there, and list_products gives each product with its scope and its documents.` };
      },
    ],
  ];

  const steps: CheckStep[] = [];
  let failed = false;
  for (const [id, title, check] of run) {
    if (failed) {
      steps.push({ id, title: title(), status: "not_run", detail: "Runs when the check above passes." });
      continue;
    }
    try {
      const { detail } = await check();
      steps.push({ id, title: title(), status: "passed", detail });
    } catch (error) {
      if (!(error instanceof CheckFailed)) throw error;
      failed = true;
      steps.push({ id, title: title(), status: "failed", detail: error.message });
    }
  }
  return { status: "checked", domain, passed: !failed, steps, distributor: failed ? null : distributor };
}
