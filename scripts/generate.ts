// Generates schema.json from schema.ts, with one definition for each exported
// type that has no type parameters, and from each zod schema that
// registry/src/schema.ts exports. Then generates tools.json: the MCP definition
// of each tool of a seller, and of each registry tool as the registry lists it.
import { isDeepStrictEqual } from "node:util";
import { join } from "node:path";
import { createGenerator } from "ts-json-schema-generator";
import ts from "typescript";
import * as registry from "@spec/registry";
import { z } from "zod";
import { EXTENSION_ID, TOOLS, type ToolName } from "@spec/schema";

const root = join(import.meta.dir, "..");
const spec = join(root, "spec");
const sourcePath = join(spec, "schema.ts");
const outPath = join(spec, "schema.json");
const toolsPath = join(spec, "tools.json");

type Schema = { [keyword: string]: unknown };

function refsOf(node: unknown, found: Set<string>): void {
  if (Array.isArray(node)) {
    node.forEach((item) => refsOf(item, found));
    return;
  }
  if (node === null || typeof node !== "object") return;
  for (const [key, value] of Object.entries(node)) {
    if (key === "$ref" && typeof value === "string") found.add(decodeURIComponent(value.replace("#/definitions/", "")));
    else refsOf(value, found);
  }
}

/** The definitions that `roots` refer to, directly or through other definitions, with the roots. */
function closure(roots: string[], definitions: Record<string, unknown>): Set<string> {
  const seen = new Set<string>();
  const queue = [...roots];
  while (queue.length) {
    const name = queue.pop() as string;
    if (seen.has(name)) continue;
    seen.add(name);
    const found = new Set<string>();
    refsOf(definitions[name], found);
    queue.push(...found);
  }
  return seen;
}

function openObjects(node: unknown): void {
  if (Array.isArray(node)) {
    node.forEach(openObjects);
    return;
  }
  if (node === null || typeof node !== "object") return;
  const schema = node as Schema;
  if (schema["additionalProperties"] === false) delete schema["additionalProperties"];
  Object.values(schema).forEach(openObjects);
}

function isExportedType(statement: ts.Statement): statement is ts.InterfaceDeclaration | ts.TypeAliasDeclaration {
  if (!ts.isInterfaceDeclaration(statement) && !ts.isTypeAliasDeclaration(statement)) return false;
  if (statement.typeParameters) return false;
  return statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false;
}

// Every object of schema.ts accepts fields that a later minor version adds.
const source = ts.createSourceFile(sourcePath, await Bun.file(sourcePath).text(), ts.ScriptTarget.ES2022, true);
const typeNames = source.statements.filter(isExportedType).map((statement) => statement.name.text);
const generator = createGenerator({
  path: sourcePath,
  tsconfig: join(root, "tsconfig.json"),
  expose: "export",
  jsDoc: "extended",
  topRef: true,
  skipTypeCheck: true,
});
const definitions: Record<string, unknown> = {};
for (const name of typeNames) Object.assign(definitions, generator.createSchema(name).definitions);
openObjects(definitions);

/** The schema with no description, to compare what two schemas accept. */
function withoutDescriptions(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(withoutDescriptions);
  if (node === null || typeof node !== "object") return node;
  return Object.fromEntries(Object.entries(node).filter(([key]) => key !== "description").map(([key, value]) => [key, withoutDescriptions(value)]));
}

// Each zod schema of the registry, by its export name. A z.object accepts more
// fields, and the params are z.strictObject, so that a call cannot carry
// customer data in a field that the draft does not define (check RG8). The
// registry shares some types with schema.ts, such as CountryCode. Each one must
// accept the same values in both, and the definition of schema.ts stays.
const registryTypes = z.registry<{ id: string }>();
for (const [name, value] of Object.entries(registry)) if (value instanceof z.ZodType) registryTypes.add(value, { id: name });
const { schemas } = z.toJSONSchema(registryTypes, { target: "draft-2020-12", io: "input", uri: (id) => `#/definitions/${id}` });
const registryDefinitions = Object.fromEntries(Object.entries(schemas).map(([name, { $schema: _, $id: __, ...definition }]) => [name, definition]));
for (const [name, definition] of Object.entries(registryDefinitions)) {
  if (!(name in definitions)) definitions[name] = definition;
  else if (!isDeepStrictEqual(withoutDescriptions(definitions[name]), withoutDescriptions(definition))) {
    throw new Error(`registry/src/schema.ts defines ${name} differently from spec/schema.ts`);
  }
}

const schema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://agenticinsuranceprotocol.org/schemas/0.1/schema.json",
  title: "Agentic Insurance Protocol (AIP), draft 0.1",
  description: "Generated from schema.ts and registry/src/schema.ts. Do not edit by hand.",
  definitions: Object.fromEntries(
    Object.keys(definitions)
      .sort()
      .map((name) => [name, definitions[name]]),
  ),
};

await Bun.write(outPath, JSON.stringify(schema, null, 2) + "\n");
console.log(`${typeNames.length} exported types and ${Object.keys(registryDefinitions).length} registry types, ${Object.keys(definitions).length} definitions`);

/* tools.json */

function pascal(tool: string): string {
  return tool.replace(/(^|_)([a-z])/g, (_, __, letter: string) => letter.toUpperCase());
}

/** A schema that stands alone: the definition, with the definitions it refers to under `$defs`. */
function standalone(root: Schema): Schema {
  const names = new Set<string>();
  refsOf(root, names);
  const needed = closure([...names], definitions);
  const rewrite = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(rewrite);
    if (node === null || typeof node !== "object") return node;
    return Object.fromEntries(
      Object.entries(node).map(([key, value]) => [
        key,
        key === "$ref" && typeof value === "string" ? value.replace("#/definitions/", "#/$defs/") : rewrite(value),
      ]),
    );
  };
  const defs = Object.fromEntries([...needed].sort().map((name) => [name, rewrite(definitions[name])]));
  return { type: "object", ...(rewrite(root) as Schema), ...(needed.size ? { $defs: defs } : {}) };
}

function definitionRef(name: string): Schema {
  if (!(name in definitions)) throw new Error(`schema.json has no definition ${name}`);
  return { $ref: `#/definitions/${name}` };
}

/** A definition with a `$ref` at its root replaced by its target. */
function resolved(schema: Schema): Schema {
  const ref = schema.$ref;
  if (typeof ref !== "string") return schema;
  const { $ref: _ref, ...rest } = schema;
  return { ...resolved(definitions[decodeURIComponent(ref.replace("#/definitions/", ""))] as Schema), ...rest };
}

/**
 * The input schema of a tool, with its properties at the root. Models read
 * the properties of the root, and with a `$ref` there, a model sent nested
 * params as strings of JSON.
 */
function inputSchema(name: string): Schema {
  return standalone(resolved(definitionRef(name)));
}

/** The result of a tool, or the error that it puts in `structuredContent.error` with `isError: true`. */
function outputSchema(result: string, error: string): Schema {
  return standalone({
    anyOf: [
      definitionRef(result),
      { type: "object", properties: { error: definitionRef(error) }, required: ["error"] },
    ],
  });
}

const sellerTools = (Object.keys(TOOLS) as ToolName[]).map((tool) => {
  const { level, readOnlyHint, description } = TOOLS[tool];
  return {
    name: tool,
    description,
    inputSchema: inputSchema(`${pascal(tool)}Params`),
    outputSchema: outputSchema(`${pascal(tool)}Result`, "AipError"),
    annotations: { readOnlyHint, destructiveHint: false, idempotentHint: readOnlyHint },
    _meta: { [EXTENSION_ID]: { level } },
  };
});

// What McpServer gives in tools/list for each zod schema.
const registryTools = Object.entries(registry.REGISTRY_TOOLS).map(([name, { description, params, result }]) => ({
  name,
  description,
  inputSchema: { type: "object", ...params["~standard"].jsonSchema.input({ target: "draft-2020-12" }) },
  outputSchema: result["~standard"].jsonSchema.output({ target: "draft-2020-12" }),
  annotations: registry.REGISTRY_TOOL_ANNOTATIONS,
}));

const tools = {
  $id: "https://agenticinsuranceprotocol.org/schemas/0.1/tools.json",
  title: "Agentic Insurance Protocol (AIP), draft 0.1: MCP tool definitions",
  description:
    "The MCP definition of each tool of a seller's server and of the registry, as tools/list returns it. Generated from schema.ts and registry/src/schema.ts. Do not edit by hand.",
  servers: {
    [EXTENSION_ID]: { tools: sellerTools },
    [registry.REGISTRY_EXTENSION_ID]: { tools: registryTools },
  },
};

await Bun.write(toolsPath, JSON.stringify(tools, null, 2) + "\n");
console.log(`${sellerTools.length + registryTools.length} tool definitions`);
