// Reads the files of the repository. The website runs from website/ and the
// scripts run from the root, so REPO_ROOT finds the root for each read.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** The root of the repository. The checks run from it, and the website runs from website/. */
export const REPO_ROOT = existsSync(join(process.cwd(), "spec")) ? process.cwd() : join(process.cwd(), "..");

/** A file by its path from the root of the repository. */
export function readRepoFile(path: string): string {
  return readFileSync(join(REPO_ROOT, path), "utf8");
}

export function readRepoJson<T>(path: string): T {
  return JSON.parse(readRepoFile(path)) as T;
}
