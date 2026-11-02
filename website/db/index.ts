import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// The Neon database in DATABASE_URL, or null when it is not set, as in a local
// build or a preview with no database.
export function database() {
  const url = process.env.DATABASE_URL;
  return url ? drizzle({ client: neon(url), casing: "snake_case" }) : null;
}

// What to log of a query that failed. The message of a DrizzleQueryError holds
// the values of the query, and a Postgres message can quote one, so keep only
// the name of the cause and its SQLSTATE code.
export function queryFailure(error: unknown) {
  const cause = error instanceof Error && error.cause instanceof Error ? error.cause : error;
  const code = cause && typeof cause === "object" && "code" in cause ? cause.code : undefined;
  return { error: cause instanceof Error ? cause.name : typeof cause, code };
}
