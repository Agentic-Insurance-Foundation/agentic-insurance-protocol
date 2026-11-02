"use server";

import { database, queryFailure } from "@/db";
import { listingRequests } from "@/db/schema";
import { LISTING_LIMITS, checkableLicences, type ListingState, type ListingTextField, type ListingValues, type ServerCheck } from "@/lib/listings";
import { checkServer } from "@/lib/server-check";
import { PARTNER_EMAIL } from "@/lib/site";

const TEXT_FIELDS = Object.keys(LISTING_LIMITS) as ListingTextField[];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The first step of the /submit form: steps 2, 3 and 5 of the registry spec.
export async function checkListingServer(input: string): Promise<ServerCheck> {
  if (typeof input !== "string" || input.length > LISTING_LIMITS.domain) return { status: "invalid", message: "Enter a domain, such as pets.example.com." };
  return checkServer(input);
}

// Saves a request of the /submit form in the listingRequests table of
// db/schema.ts. Anyone can call a server action, so check each value again
// here, and run the checks of the server again: the form sends only the
// domain, and the request takes the name, the countries, the roles and the
// licences from get_distributor. The operator checks the licences by hand
// later. A bot fills the hidden "url" field: drop its request, and answer as
// if it was sent.
export async function requestListing(_state: ListingState, form: FormData): Promise<ListingState> {
  if (form.get("url")) return { status: "sent" };
  const values = Object.fromEntries(
    TEXT_FIELDS.map((name) => {
      const value = form.get(name);
      return [name, typeof value === "string" ? value.trim() : ""];
    }),
  ) as ListingValues;
  const fail = (message: string): ListingState => ({ status: "error", message, values });
  if (!values.firstName || !values.lastName) return fail("Fill in each field that is not optional.");
  if (!EMAIL.test(values.email)) return fail("Enter a valid email address.");
  if (TEXT_FIELDS.some((field) => values[field].length > LISTING_LIMITS[field])) return fail("One of the answers is too long.");

  const check = await checkServer(values.domain);
  if (check.status !== "checked" || !check.passed || !check.distributor) {
    return fail("Your server does not pass the checks now. Go back to the first step, and check it again.");
  }
  const { domain, distributor } = check;
  if (checkableLicences(distributor).length === 0) return fail("Your server declares no licence in a country that the registry covers.");

  const db = database();
  if (!db) {
    console.error("DATABASE_URL is not set, so a listing request was not saved.");
    return fail(`We could not save your request. Write to ${PARTNER_EMAIL}.`);
  }
  try {
    await db.insert(listingRequests).values({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      company: distributor.legalName,
      website: `https://${domain}`,
      server: `https://${domain}/.well-known/aip.json`,
      countries: distributor.countries,
      role: distributor.roles.join(", "),
      registerNumbers: distributor.licences.map((licence) => `${licence.country} ${licence.register} ${licence.identifier}`).join("; "),
      message: values.message || null,
    });
  } catch (error) {
    console.error("A listing request was not saved.", queryFailure(error));
    return fail(`We could not save your request. Try again, or write to ${PARTNER_EMAIL}.`);
  }
  return { status: "sent" };
}
