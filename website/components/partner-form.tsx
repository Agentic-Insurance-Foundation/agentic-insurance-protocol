"use client";

import { useActionState } from "react";
import { requestPartnership } from "@/lib/partner-request";
import { PARTNER_LIMITS, PARTNER_SIZES, PARTNER_TYPES, type PartnerState, type PartnerTextField, type PartnerValues } from "@/lib/partners";
import { button, control, field, fieldRow, fieldHint, fieldLabel, formError } from "@/lib/ui";

const IDLE: PartnerState = { status: "idle" };

// The card of the form. After the request is saved, the same card holds the
// thank-you.
const CARD = "grid justify-items-start gap-4 rounded-md border bg-canvas p-8 max-sm:p-6";

// The form of the /join page. After an error, it keeps what the visitor wrote.
// After the request is saved, a thank-you replaces it.
export function PartnerForm() {
  const [state, action, pending] = useActionState(requestPartnership, IDLE);
  if (state.status === "sent") {
    return (
      <div className={CARD} role="status">
        <p className="text-title-4 text-ink">Thank you</p>
        <p className="text-ink-muted">We have your request, and we will write to you soon.</p>
      </div>
    );
  }
  const values = state.status === "error" ? state.values : undefined;
  return (
    <form className={CARD} action={action}>
      {/* Two fields side by side, one above the other on a narrow screen. */}
      <div className={fieldRow}>
        <TextField name="firstName" label="First name" autoComplete="given-name" values={values} />
        <TextField name="lastName" label="Last name" autoComplete="family-name" values={values} />
      </div>
      <TextField name="title" label="Title" autoComplete="organization-title" values={values} />
      <TextField name="email" label="Email" type="email" autoComplete="email" values={values} />
      <TextField name="company" label="Company name" autoComplete="organization" values={values} />
      <SelectField name="size" label="Company size" options={PARTNER_SIZES} values={values} />
      <SelectField name="type" label="Type of company" options={PARTNER_TYPES} values={values} />
      <div className={field}>
        <label className={fieldLabel} htmlFor="partner-message">
          Tell us more about your interest in AIP <span className={fieldHint}>Optional</span>
        </label>
        <textarea
          className={`${control} resize-y`}
          id="partner-message"
          name="message"
          rows={5}
          maxLength={PARTNER_LIMITS.message}
          defaultValue={values?.message}
        />
      </div>
      <div className="mt-4 grid gap-1">
        <h2 className="text-title-4 text-ink">Technical contact</h2>
        <p className="text-14 text-ink-muted">The person who would build with AIP, if it is not you.</p>
      </div>
      <TextField name="contactName" label="Contact name" autoComplete="off" optional values={values} />
      <TextField name="contactEmail" label="Contact email" type="email" autoComplete="off" optional values={values} />
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="partner-website">Website</label>
        <input id="partner-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {state.status === "error" ? (
        <p className={formError} role="alert">
          {state.message}
        </p>
      ) : null}
      <div className="mt-2 grid justify-items-start gap-3">
        <button className={button({ primary: true })} type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send the request"}
        </button>
        <p className="text-14 text-ink-subtle">We use these details only to answer you about AIP.</p>
      </div>
    </form>
  );
}

type TextFieldProps = {
  name: PartnerTextField;
  label: string;
  type?: "text" | "email";
  autoComplete: string;
  optional?: boolean;
  values: PartnerValues | undefined;
};

function TextField({ name, label, type = "text", autoComplete, optional = false, values }: TextFieldProps) {
  const id = `partner-${name}`;
  return (
    <div className={field}>
      <label className={fieldLabel} htmlFor={id}>
        {label} {optional ? <span className={fieldHint}>Optional</span> : null}
      </label>
      <input
        className={control}
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={!optional}
        maxLength={PARTNER_LIMITS[name]}
        defaultValue={values?.[name]}
      />
    </div>
  );
}

type SelectFieldProps = { name: "size" | "type"; label: string; options: string[]; values: PartnerValues | undefined };

function SelectField({ name, label, options, values }: SelectFieldProps) {
  const id = `partner-${name}`;
  return (
    <div className={field}>
      <label className={fieldLabel} htmlFor={id}>
        {label}
      </label>
      {/* React does not apply a new defaultValue to a select, so the key mounts it again with the value of the error. */}
      <select className={control} key={values?.[name]} id={id} name={name} required defaultValue={values?.[name] ?? ""}>
        <option value="" disabled>
          Choose one
        </option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}
