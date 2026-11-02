"use server";

import { database, queryFailure } from "@/db";
import { partnerRequests } from "@/db/schema";
import { PARTNER_LIMITS, PARTNER_SIZES, PARTNER_TYPES, type PartnerState, type PartnerTextField, type PartnerValues } from "@/lib/partners";
import { PARTNER_EMAIL } from "@/lib/site";

const TEXT_FIELDS = Object.keys(PARTNER_LIMITS) as PartnerTextField[];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Saves a request of the form of the launch partners in the partnerRequests
// table of db/schema.ts. Anyone can call a server action, so check each value
// again here. A bot fills the hidden "website" field: drop its request, and
// answer as if it was sent.
export async function requestPartnership(_state: PartnerState, form: FormData): Promise<PartnerState> {
  if (form.get("website")) return { status: "sent" };
  const values = Object.fromEntries(
    [...TEXT_FIELDS, "size", "type"].map((name) => {
      const value = form.get(name);
      return [name, typeof value === "string" ? value.trim() : ""];
    }),
  ) as PartnerValues;
  const fail = (message: string): PartnerState => ({ status: "error", message, values });
  if (!values.firstName || !values.lastName || !values.title || !values.company) return fail("Fill in each field that is not optional.");
  if (!EMAIL.test(values.email)) return fail("Enter a valid email address.");
  if (values.contactEmail && !EMAIL.test(values.contactEmail)) return fail("Enter a valid email address for the technical contact.");
  if (!PARTNER_SIZES.includes(values.size)) return fail("Choose the size of your company.");
  if (!PARTNER_TYPES.includes(values.type)) return fail("Choose the type of your company.");
  if (TEXT_FIELDS.some((field) => values[field].length > PARTNER_LIMITS[field])) return fail("One of the answers is too long.");

  const db = database();
  if (!db) {
    console.error("DATABASE_URL is not set, so a partner request was not saved.");
    return fail(`We could not save your request. Write to ${PARTNER_EMAIL}.`);
  }
  try {
    await db.insert(partnerRequests).values({
      ...values,
      message: values.message || null,
      contactName: values.contactName || null,
      contactEmail: values.contactEmail || null,
    });
  } catch (error) {
    console.error("A partner request was not saved.", queryFailure(error));
    return fail(`We could not save your request. Try again, or write to ${PARTNER_EMAIL}.`);
  }
  return { status: "sent" };
}
