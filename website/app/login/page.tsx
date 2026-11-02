import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { ACCESS_COOKIE, ACCESS_MAX_AGE, accessToken, LOGIN_PATH, safeNext, sameSecret } from "@/lib/access";
import { SITE_NAME } from "@/lib/site";
import { button, control, field, fieldLabel, formError } from "@/lib/ui";

export const metadata: Metadata = { title: "Log in", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ next?: string | string[]; error?: string | string[] }> };

// Checks the password, sets the cookie that proxy.ts reads, and opens the page
// the visitor asked for.
async function logIn(form: FormData) {
  "use server";
  const next = safeNext(form.get("next"));
  const password = process.env.SITE_PASSWORD;
  const given = form.get("password");
  if (!password || typeof given !== "string" || !sameSecret(given, password)) {
    redirect(`${LOGIN_PATH}?error=1&next=${encodeURIComponent(next)}`);
  }
  (await cookies()).set(ACCESS_COOKIE, accessToken(password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_MAX_AGE,
  });
  redirect(next);
}

export default async function Login({ searchParams }: Props) {
  const { next, error } = await searchParams;
  // The panel covers the whole page, header and footer too, until the visitor
  // gives the password. data-gate hides the skip link, the header and the footer.
  return (
    <div className="fixed inset-0 z-100 grid place-items-center bg-surface p-6" data-gate>
      <form className="grid w-full max-w-[400px] justify-items-start gap-4 rounded-md border bg-canvas p-8" action={logIn}>
        <BrandMark size={40} />
        <h1 className="text-title-3">{SITE_NAME}</h1>
        <p className="text-ink-muted">This site is private until the launch. Enter the password to open it.</p>
        <input type="hidden" name="next" value={safeNext(next)} />
        <div className={field}>
          <label className={fieldLabel} htmlFor="password">
            Password
          </label>
          <input
            className={control}
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "password-error" : undefined}
          />
          {error ? (
            <p className={formError} id="password-error" role="alert">
              This password is not correct.
            </p>
          ) : null}
        </div>
        <button className={`${button({ primary: true })} w-full justify-center`} type="submit">
          Open the site
        </button>
      </form>
    </div>
  );
}
