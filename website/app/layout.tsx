import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { DESCRIPTION, OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import "./tokens.css";
import "./globals.css";

// The font files of the AIP Design System, served from this site.
const sans = localFont({
  src: [
    { path: "./fonts/IBMPlexSans-Variable.woff2", weight: "100 700", style: "normal" },
    { path: "./fonts/IBMPlexSans-Italic-Variable.woff2", weight: "100 700", style: "italic" },
  ],
  variable: "--font-plex-sans",
  display: "swap",
});
const mono = localFont({
  src: [
    { path: "./fonts/IBMPlexMono-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/IBMPlexMono-Medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} (AIP)`, template: "%s · AIP" },
  description: DESCRIPTION,
  openGraph: { siteName: SITE_NAME, title: `${SITE_NAME} (AIP)`, description: DESCRIPTION, url: "/", type: "website", images: [OG_IMAGE] },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1322" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <a
          className="absolute -top-15 left-3 z-100 rounded-sm bg-ink px-3 py-2 text-14/6.5 text-canvas focus:top-3 [body:has([data-gate])_&]:hidden"
          href="#main"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
