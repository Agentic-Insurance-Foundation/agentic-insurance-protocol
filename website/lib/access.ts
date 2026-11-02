import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// The site is private until the launch. The login page checks SITE_PASSWORD and
// sets ACCESS_COOKIE, and proxy.ts lets a request through only with that cookie.
export const LOGIN_PATH = "/login";
export const ACCESS_COOKIE = "aip_access";
export const ACCESS_MAX_AGE = 60 * 60 * 24 * 30;

// The cookie holds an HMAC of the password, never the password. A new password
// makes every earlier cookie invalid.
export function accessToken(password: string) {
  return createHmac("sha256", password).update("aip-access").digest("hex");
}

// Compares hashes of the same length, so the time of the check does not show the secret.
export function sameSecret(given: string, expected: string) {
  return timingSafeEqual(digest(given), digest(expected));
}

// The page to open after the login: a path on this site, never another site or the login page.
// Browsers drop tabs and line breaks in a URL and read "\" as "/", so "/\t/x.com"
// would open x.com: reject those characters, then parse the path against a fixed
// origin. The parse removes dot segments, so "/.//x.com" gives "//x.com": check
// the result too.
export function safeNext(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || /[\u0000-\u001f\u007f\\]/.test(value)) return "/";
  const base = "http://site.invalid";
  let url: URL;
  try {
    url = new URL(value, base);
  } catch {
    return "/";
  }
  const path = url.pathname + url.search + url.hash;
  if (url.origin !== base || path.startsWith("//") || url.pathname.startsWith(LOGIN_PATH)) return "/";
  return path;
}

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}
