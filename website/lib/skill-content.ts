// The docs pages of the skill, the copy of the skill files on the site and the
// home page read skills/, so that they show the skill as it is in the
// repository. A file that does not have the expected shape fails the build.

import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT, readRepoFile } from "./repo-files";

const SKILLS_DIR = "skills";
const SKILL_DIR = "agentic-insurance-protocol";
const SKILL_FILE = `${SKILL_DIR}/SKILL.md`;
const GUIDELINES_FILE = `${SKILL_DIR}/guidelines.md`;
const COUNTRIES_DIR = `${SKILL_DIR}/references/countries`;

export interface Source {
  title: string;
  url: string;
}

interface FrontMatter {
  /** The `key: value` lines. */
  values: Record<string, string>;
  /** The maps of `key: value` lines, such as `metadata`. */
  maps: Record<string, Record<string, string>>;
  /** The lists of maps, such as `sources`. */
  lists: Record<string, Record<string, string>[]>;
}

function unquote(value: string): string {
  return value.trim().replace(/^"(.*)"$/, "$1");
}

/** Splits a file into its YAML front matter and its body. */
function splitFrontMatter(text: string, file: string): { header: FrontMatter; body: string } {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!match?.[1]) throw new Error(`${file} has no front matter`);
  const header: FrontMatter = { values: {}, maps: {}, lists: {} };
  let block = "";
  for (const line of match[1].split("\n")) {
    const top = /^([a-z_]+):\s*(.*)$/.exec(line);
    const item = /^ {2}- ([a-z_]+):\s*(.*)$/.exec(line);
    const field = /^( {2}| {4})([a-z_]+):\s*(.*)$/.exec(line);
    if (top?.[1] && top[2] !== undefined) {
      if (top[2]) header.values[top[1]] = unquote(top[2]);
      else block = top[1];
    } else if (item?.[1] && item[2] !== undefined) {
      (header.lists[block] ??= []).push({ [item[1]]: unquote(item[2]) });
    } else if (field?.[2] && field[3] !== undefined && field[1] === "    ") {
      const last = header.lists[block]?.at(-1);
      if (!last) throw new Error(`${file}: "${line.trim()}" belongs to no list item`);
      last[field[2]] = unquote(field[3]);
    } else if (field?.[2] && field[3] !== undefined) {
      (header.maps[block] ??= {})[field[2]] = unquote(field[3]);
    } else if (line.trim()) {
      throw new Error(`${file}: the front matter line "${line}" is not a key, a map or a list of maps`);
    }
  }
  return { header, body: text.slice(match[0].length) };
}

/** The body of a `## title` section of a Markdown text. */
function section(markdown: string, title: string, file: string): string {
  const heading = `\n## ${title}\n`;
  const start = markdown.indexOf(heading);
  if (start < 0) throw new Error(`${file} has no section "${title}"`);
  const body = markdown.slice(start + heading.length);
  const end = body.indexOf("\n## ");
  return (end < 0 ? body : body.slice(0, end)).trim();
}

function readSkillFile(path: string): string {
  return readRepoFile(`${SKILLS_DIR}/${path}`);
}

function required(values: Record<string, string>, key: string, file: string): string {
  const value = values[key];
  if (!value) throw new Error(`${file}: the front matter has no "${key}"`);
  return value;
}

export interface SkillManifest {
  name: string;
  version: string;
  protocol: string;
}

export function skillManifest(): SkillManifest {
  const { header } = splitFrontMatter(readSkillFile(SKILL_FILE), SKILL_FILE);
  const metadata = header.maps["metadata"] ?? {};
  return {
    name: required(header.values, "name", SKILL_FILE),
    version: required(metadata, "version", `${SKILL_FILE} metadata`),
    protocol: required(metadata, "protocol", `${SKILL_FILE} metadata`),
  };
}

export interface SkillStep {
  title: string;
  /** The text of the step, as Markdown. */
  text: string;
}

/**
 * The steps of "## Procedure" in guidelines.md, each "N. **Title.** text".
 * The notes after the numbered list are not steps, and stay out.
 */
export function skillSteps(): SkillStep[] {
  const [list = ""] = section(readSkillFile(GUIDELINES_FILE), "Procedure", GUIDELINES_FILE).split("\n\n");
  return list.split("\n").map((line, index) => {
    const step = /^(\d+)\. \*\*(.+?)\.\*\* (.+)$/.exec(line);
    if (!step?.[2] || !step[3] || Number(step[1]) !== index + 1) {
      throw new Error(`${GUIDELINES_FILE}: step ${index + 1} of the procedure is not "${index + 1}. **Title.** text"`);
    }
    return { title: step[2], text: step[3] };
  });
}

/** The items of "## Never" in guidelines.md, as Markdown. */
export function skillNever(): string[] {
  const never = section(readSkillFile(GUIDELINES_FILE), "Never", GUIDELINES_FILE);
  return never.split("\n").map((line) => {
    if (!line.startsWith("- ")) throw new Error(`${GUIDELINES_FILE}: "## Never" must be one bullet list`);
    return line.slice(2);
  });
}

export interface RulesFile {
  /** The first heading of the file. */
  name: string;
  version: string;
  owner: string;
  status: "draft" | "endorsed";
  endorsedBy?: string;
  reviewedAt?: string;
  language: string;
  sources: Source[];
  /** Path of the file in skills/. */
  path: string;
  /** The body of the file, from its first heading. */
  body: string;
  /** Numbered rules in the body. */
  rules: number;
  /** Rules that still carry "Not reviewed.". */
  notReviewed: number;
}

/** The `country.md` file of a country folder, with the other files of the folder. */
export interface CountryFile extends RulesFile {
  /** The ISO 3166-1 code in lower case, as in the folder name and the page address. */
  code: string;
  /** The files for one state, in `states/`, and for one line, in `lines/`. Each adds to the country file. */
  extraFiles: RulesFile[];
}

/** The folders of a country folder that hold extra files, and the front matter key that each of their files must have. */
const EXTRA_DIRS = [
  { dir: "states", key: "subdivision" },
  { dir: "lines", key: "line" },
] as const;

function rulesFile(path: string, code: string, key?: string): RulesFile {
  const { header, body } = splitFrontMatter(readSkillFile(path), path);
  const country = required(header.values, "country", path);
  if (country !== code.toUpperCase()) throw new Error(`${path}: the country is ${country}, and the folder says ${code}`);
  if (key) required(header.values, key, path);
  const name = /^# (.+)$/m.exec(body)?.[1];
  if (!name) throw new Error(`${path} has no "# " heading`);
  const status = required(header.values, "status", path);
  if (status !== "draft" && status !== "endorsed") throw new Error(`${path}: the status "${status}" is not "draft" or "endorsed"`);
  const sources = (header.lists["sources"] ?? []).map((source) => ({
    title: required(source, "title", `${path} sources`),
    url: required(source, "url", `${path} sources`),
  }));
  const rules = body.split("\n").filter((line) => /^\d+\. /.test(line));
  return {
    name,
    version: required(header.values, "version", path),
    owner: required(header.values, "owner", path),
    status,
    endorsedBy: header.values["endorsed_by"],
    reviewedAt: header.values["reviewed_at"],
    language: required(header.values, "language", path),
    sources,
    path,
    body: body.slice(body.indexOf(`# ${name}`)),
    rules: rules.length,
    notReviewed: rules.filter((line) => line.endsWith("Not reviewed.")).length,
  };
}

function isDirectory(path: string): boolean {
  const full = join(REPO_ROOT, SKILLS_DIR, path);
  return existsSync(full) && statSync(full).isDirectory();
}

function countryFile(code: string): CountryFile {
  const dir = `${COUNTRIES_DIR}/${code}`;
  const extraFiles = EXTRA_DIRS.flatMap(({ dir: extraDir, key }) => {
    const path = `${dir}/${extraDir}`;
    if (!isDirectory(path)) return [];
    const files = readdirSync(join(REPO_ROOT, SKILLS_DIR, path)).filter((file) => file.endsWith(".md"));
    return files.sort().map((file) => rulesFile(`${path}/${file}`, code, key));
  });
  return { ...rulesFile(`${dir}/country.md`, code), code, extraFiles };
}

/** The country files of the skill, one for each folder in `references/countries/`, by name. */
export function countryFiles(): CountryFile[] {
  const codes = readdirSync(join(REPO_ROOT, SKILLS_DIR, COUNTRIES_DIR)).filter((entry) => isDirectory(`${COUNTRIES_DIR}/${entry}`));
  return codes.map(countryFile).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Every file of skills/, as a path inside it. The site serves each one as it
 * is. It leaves out hidden files, and the installed packages and the local
 * data of the seller template.
 */
export function skillFiles(dir = ""): string[] {
  const skipped = new Set(["node_modules", "data"]);
  return readdirSync(join(REPO_ROOT, SKILLS_DIR, dir)).flatMap((entry) => {
    if (entry.startsWith(".") || skipped.has(entry)) return [];
    const path = dir ? `${dir}/${entry}` : entry;
    return statSync(join(REPO_ROOT, SKILLS_DIR, path)).isDirectory() ? skillFiles(path) : [path];
  });
}

export function readSkillAsset(path: string): string {
  if (!skillFiles().includes(path)) throw new Error(`skills/ has no file "${path}"`);
  return readSkillFile(path);
}

export const SKILL_FILE_PATH = `${SKILLS_DIR}/${SKILL_FILE}`;
export const GUIDELINES_FILE_PATH = `${SKILLS_DIR}/${GUIDELINES_FILE}`;
