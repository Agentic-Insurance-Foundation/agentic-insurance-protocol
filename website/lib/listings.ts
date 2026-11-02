// The form of the /submit page, where a seller asks to be listed in the
// registry. The form, the checks of `lib/server-check.ts` and the server
// actions in `lib/listing-request.ts` share these lists, limits and types.

// The countries where the test registry checks licences.
export const LISTING_COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "FR", name: "France" },
];

// The longest answer that each text field takes, in characters. The domain
// field takes a website or the address of an aip.json too.
export const LISTING_LIMITS = {
  domain: 500,
  firstName: 100,
  lastName: 100,
  email: 254,
  message: 2000,
};

export type ListingTextField = keyof typeof LISTING_LIMITS;

export type ListingValues = Record<ListingTextField, string>;

export type ListingState =
  | { status: "idle" }
  | { status: "sent" }
  | { status: "error"; message: string; values: ListingValues };

// Steps 2, 3 and 5 of section 8.1 of the registry spec, as the form runs them.
export type CheckId = "aip_json" | "mcp_server" | "tools";

export type CheckStep = {
  id: CheckId;
  title: string;
  status: "passed" | "failed" | "not_run";
  detail: string;
};

export type ClaimedLicence = {
  country: string;
  regulator: string;
  register: string;
  identifier: string;
  role: string;
};

// What get_distributor returns, for the step of the licences and for the request.
export type Distributor = {
  legalName: string;
  roles: string[];
  countries: string[];
  level: number;
  licences: ClaimedLicence[];
};

export type ServerCheck =
  | { status: "invalid"; message: string }
  | { status: "checked"; domain: string; passed: boolean; steps: CheckStep[]; distributor: Distributor | null };

// The licences that the test registry can check: those in one of its countries.
export function checkableLicences(distributor: Distributor): ClaimedLicence[] {
  return distributor.licences.filter((licence) => LISTING_COUNTRIES.some((country) => country.code === licence.country));
}
