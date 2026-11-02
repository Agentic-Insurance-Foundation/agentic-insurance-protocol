// The form of the launch partners, on the /join page. The form and the server
// action in `lib/partner-request.ts` share these lists, limits and types.
export const PARTNER_SIZES = ["1–10", "11–50", "51–200", "201–1,000", "1,001–5,000", "More than 5,000"];

export const PARTNER_TYPES = ["Insurer", "Broker or other intermediary", "AI lab", "Startup or scale-up", "Regulator", "Other"];

// The longest answer that each text field takes, in characters.
export const PARTNER_LIMITS = {
  firstName: 100,
  lastName: 100,
  title: 200,
  email: 254,
  company: 200,
  message: 2000,
  contactName: 200,
  contactEmail: 254,
};

export type PartnerTextField = keyof typeof PARTNER_LIMITS;

export type PartnerValues = Record<PartnerTextField | "size" | "type", string>;

export type PartnerState =
  | { status: "idle" }
  | { status: "sent" }
  | { status: "error"; message: string; values: PartnerValues };
