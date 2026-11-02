// Reads the test cases of the evaluation from the skill's evals/evals.json. A
// test case names each rule that it tests in one of two forms: a section of a
// specification, such as "AIP 9.2" or "Registry 6.5", or one item of a file of
// the skill, such as "fr/country.md: Who may sell, 2" or "guidelines.md: Never, 1".
import { existsSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT, readRepoFile, readRepoJson } from "@/website/lib/repo-files";

const SKILL_DIR = "skills/agentic-insurance-protocol";
const COUNTRIES_DIR = `${SKILL_DIR}/references/countries`;
export const SPEC_FILES: Record<string, string> = { AIP: "docs/0.1/spec.mdx", Registry: "docs/0.1/registry.mdx" };

const EVALS_FILE_PATH = `${SKILL_DIR}/evals/evals.json`;

export interface EvalCase {
  id: number;
  name: string;
  /** The ISO 3166-1 code of the customer's country. */
  country: string;
  risk: string;
  rules: string[];
  setup: string;
  prompt: string;
  expected_output: string;
  files: string[];
  assertions: string[];
}

export function evalFile(): { skill_name: string; evals: EvalCase[] } {
  return readRepoJson(EVALS_FILE_PATH);
}

export function evalCases(): EvalCase[] {
  return evalFile().evals;
}

/** The numbered and bulleted lines of the `## ` section of a Markdown file, or null when it has no such section. */
export function sectionItems(markdown: string, heading: string): string[] | null {
  const section = markdown.split(/^## /m).find((part) => part.startsWith(`${heading}\n`));
  return section ? section.split("\n").filter((line) => /^(\d+\.|-) /.test(line)) : null;
}

/** The name of a rule of a country file, as a test case gives it. */
export function countryRuleName(file: string, heading: string, number: number): string {
  return `${file}: ${heading}, ${number}`;
}

/** Whether the rule that a test case names exists in a specification or in a file of the skill. */
export function ruleExists(rule: string): boolean {
  const spec = /^(AIP|Registry) (\d+(?:\.\d+)?)$/.exec(rule);
  if (spec?.[1] && spec[2]) {
    const text = readRepoFile(SPEC_FILES[spec[1]] ?? "");
    return new RegExp(`^#{2,3} ${spec[2].replace(".", "\\.")}\\.? `, "m").test(text);
  }
  const item = /^([a-z0-9/._-]+\.md): (.+), (\d+)$/.exec(rule);
  if (!item?.[1] || !item[2] || !item[3]) return false;
  const path = item[1] === "guidelines.md" ? `${SKILL_DIR}/${item[1]}` : `${COUNTRIES_DIR}/${item[1]}`;
  if (!existsSync(join(REPO_ROOT, path))) return false;
  const items = sectionItems(readRepoFile(path), item[2]);
  const number = Number(item[3]);
  return items !== null && number >= 1 && number <= items.length;
}
