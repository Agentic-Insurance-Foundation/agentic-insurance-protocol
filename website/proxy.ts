import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, accessToken, LOGIN_PATH, sameSecret } from "@/lib/access";

// The site is private until the launch. A request without the access cookie goes
// to the login page, which sets it. Without SITE_PASSWORD, production is closed,
// and a preview or a local build is open.
export function proxy(request: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) {
    if (process.env.VERCEL_ENV === "production") return new Response("SITE_PASSWORD is not set.", { status: 503 });
    return NextResponse.next();
  }
  const { pathname, search } = request.nextUrl;
  const cookie = request.cookies.get(ACCESS_COOKIE)?.value ?? "";
  if (pathname === LOGIN_PATH || sameSecret(cookie, accessToken(password))) return NextResponse.next();
  const login = new URL(LOGIN_PATH, request.url);
  if (pathname !== "/") login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

// The login page loads its scripts, styles and fonts from _next/static, and the
// acorn and the icons from the root, so these stay open. The scripts hold the code
// and the labels of the client components. The text of each page comes from the
// server, behind the cookie. The paths for an AI agent stay open too, so that it
// can use AIP before the launch: llms.txt, install.md and schema.json, which
// redirect, and the schemas and the files of the skill, which the docs link to.
export const config = {
  matcher: [
    "/((?!_next/static/|_vercel/|aip-mark\\.svg$|icon\\.svg$|apple-icon\\.png$|llms\\.txt$|install\\.md$|schema\\.json$|schemas/|skills/).*)",
  ],
};
