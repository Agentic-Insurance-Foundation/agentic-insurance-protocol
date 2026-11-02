import type { CallToolResult } from "@modelcontextprotocol/server";
import type { RegistryErrorCode } from "../schema.js";

export function ok(data: object, text: string): CallToolResult {
  // A short summary, then the same JSON as structuredContent, for the hosts that
  // show the AI agent only content.
  return {
    content: [
      { type: "text", text },
      { type: "text", text: JSON.stringify(data) },
    ],
    structuredContent: data as Record<string, unknown>,
  };
}

export function fail(code: RegistryErrorCode, message: string): CallToolResult {
  const error = { code, message };
  return {
    content: [
      { type: "text", text: `Error ${code}: ${message}` },
      { type: "text", text: JSON.stringify({ error }) },
    ],
    structuredContent: { error },
    isError: true,
  };
}
