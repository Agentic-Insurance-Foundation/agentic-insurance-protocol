/**
 * Agentic Insurance Protocol (AIP): registry, draft 0.1
 *
 * The registry server is the source of truth of the registry. Its types, its
 * tools and its rules are in `registry/src/schema.ts`. This file exports them
 * again, so that the spec, the site and the scripts import them from `spec/`. `scripts/generate.ts` writes their JSON Schema in `schema.json` and
 * `tools.json`.
 */

export * from "../registry/src/schema";
