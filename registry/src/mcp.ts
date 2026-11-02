import { McpServer, type CallToolResult, type JSONObject } from "@modelcontextprotocol/server";
import type { z } from "zod";
import { LISTING_URL, TEST_DATA, publicUrl } from "./config.js";
import { COUNTRIES, SOURCES } from "./data/index.js";
import {
  REGISTRY_EXTENSION_ID,
  REGISTRY_TOOL_ANNOTATIONS,
  REGISTRY_TOOLS,
  type RegistrySettings,
  type RegistryToolName,
} from "./schema.js";
import { RULES_COUNTRIES, getCountryRules } from "./tools/get-country-rules.js";
import { searchDistributors } from "./tools/search-distributors.js";
import { verifyLicence } from "./tools/verify-licence.js";

export const settings = (): RegistrySettings => ({
  version: "0.1",
  countries: COUNTRIES,
  rules_countries: RULES_COUNTRIES,
  sources: SOURCES,
  policy_url: `${publicUrl()}/`,
  listing_url: LISTING_URL,
});

const handlers: { [K in RegistryToolName]: (params: z.infer<(typeof REGISTRY_TOOLS)[K]["params"]>) => CallToolResult } = {
  search_distributors: searchDistributors,
  verify_licence: verifyLicence,
  get_country_rules: getCountryRules,
};

export function createServer(): McpServer {
  const server = new McpServer(
    {
      name: "aip-registry",
      title: TEST_DATA ? "AIP registry (test data)" : "AIP registry",
      version: "0.1.0",
      websiteUrl: publicUrl(),
      icons: [
        { src: `${publicUrl()}/aip-mark.svg`, mimeType: "image/svg+xml", sizes: ["any"] },
        { src: `${publicUrl()}/apple-touch-icon.png`, mimeType: "image/png", sizes: ["180x180"] },
      ],
    },
    {
      // The list of tools never changes while the registry runs.
      capabilities: { tools: { listChanged: false }, extensions: { [REGISTRY_EXTENSION_ID]: settings() as unknown as JSONObject } },
      instructions: `The AIP registry. It finds the sellers that speak the Agentic Insurance Protocol, checks a licence in the public registers, and serves the rules of each country. ${
        TEST_DATA
          ? "Test data: every register entry is fictional."
          : 'It reads no register and lists no server yet, so each licence check gives "unknown".'
      } Never send customer data here.`,
    },
  );

  // McpServer checks the params and each result with the zod schemas, and lists them in tools/list.
  for (const [name, { description, params, result }] of Object.entries(REGISTRY_TOOLS)) {
    server.registerTool(
      name,
      { description, inputSchema: params, outputSchema: result, annotations: REGISTRY_TOOL_ANNOTATIONS },
      // McpServer calls it only with params that passed the check.
      handlers[name as RegistryToolName] as (params: unknown) => CallToolResult,
    );
  }
  return server;
}
