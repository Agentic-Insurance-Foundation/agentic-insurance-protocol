import { join } from "node:path";
import type { NextConfig } from "next";

// Every page except the login page is prerendered at build time. It is not a
// static export, because proxy.ts checks the access cookie on each request.
// vercel.json holds the redirects and headers.
//
// The website runs from website/ and reads spec/ and skills/ from the root of
// the repository, so the root of the build is the folder above.
const root = join(process.cwd(), "..");

const config: NextConfig = {
  devIndicators: false,
  turbopack: { root },
  outputFileTracingRoot: root,
};

export default config;
