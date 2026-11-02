import { sql } from "drizzle-orm";
import { bigint, check, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// The tables of the site database. The columns are camelCase here and snake_case
// in the database (`casing` in db/index.ts and drizzle.config.ts). After a
// change, run `bun run db:generate` and commit the migration in db/migrations/.

// The requests of the form of the launch partners, on the /join page.
export const partnerRequests = pgTable("partner_requests", {
  id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  firstName: text().notNull(),
  lastName: text().notNull(),
  title: text().notNull(),
  email: text().notNull(),
  company: text().notNull(),
  size: text().notNull(),
  type: text().notNull(),
  message: text(),
  contactName: text(),
  contactEmail: text(),
});

// The requests to be listed in the registry, from the form of the /submit page.
// The form saves a request only when the aip.json, get_distributor and the
// tools of the level pass, and takes company, countries, role and
// registerNumbers from get_distributor. The operator checks each licence in its
// public register by hand, as section 8 of the registry specification says.
// Then it answers the seller by email, and sets status and answer.
export const listingRequests = pgTable(
  "listing_requests",
  {
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    firstName: text().notNull(),
    lastName: text().notNull(),
    email: text().notNull(),
    company: text().notNull(),
    website: text().notNull(),
    // The aip.json of the domain. Requests from before the checks of the form can have none.
    server: text(),
    countries: text().array().notNull(),
    role: text().notNull(),
    // The licences of get_distributor, as "country register identifier", separated by "; ".
    registerNumbers: text(),
    message: text(),
    status: text().notNull().default("received"),
    answer: text(),
    answeredAt: timestamp({ withTimezone: true }),
  },
  (table) => [check("listing_requests_status", sql`${table.status} in ('received', 'listed', 'on_hold', 'refused')`)],
);
