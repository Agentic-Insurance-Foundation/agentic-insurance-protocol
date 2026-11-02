import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { OG_IMAGE, SITE_NAME, SITE_URL, TAGLINE, VERSION } from "@/lib/site";

// The image that a shared link to any page shows, rendered once at build time.
// It is a route, not an `opengraph-image` file, so that the export writes it
// with its extension and each page can name it in its own `openGraph`.

export const dynamic = "force-static";

const root = process.cwd();

// The renderer reads no woff2, so the fonts are static TTF instances of
// `app/fonts/IBMPlexSans-Variable.woff2` at 400, 500 and 600.
const fonts = await Promise.all(
  [
    { file: "IBMPlexSans-Regular.ttf", weight: 400 },
    { file: "IBMPlexSans-Medium.ttf", weight: 500 },
    { file: "IBMPlexSans-SemiBold.ttf", weight: 600 },
  ].map(async ({ file, weight }) => ({
    name: "IBM Plex Sans",
    data: await readFile(join(root, "app/fonts", file)),
    weight: weight as 400 | 500 | 600,
    style: "normal" as const,
  })),
);

const mark = `data:image/svg+xml;base64,${(await readFile(join(root, "public/aip-mark.svg"))).toString("base64")}`;

// The light values of `app/tokens.css`. The image has no CSS variables, so it
// reads each value from the file.
const tokensCss = await readFile(join(root, "app/tokens.css"), "utf8");
const lightTokens = tokensCss.slice(0, tokensCss.indexOf("@media"));
function token(name: string): string {
  const value = lightTokens.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1];
  if (!value) throw new Error(`app/tokens.css has no --${name}`);
  return value.trim();
}

export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: 80,
        background: token("surface"),
        color: token("ink"),
        fontFamily: "IBM Plex Sans",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* The acorn has space around it in its file: the margin puts its edge on the edge of the text. */}
        <img src={mark} width={88} height={88} alt="" style={{ marginLeft: -16 }} />
        <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: -0.4 }}>{SITE_NAME}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, gap: 16 }}>
        <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: 1.44, textTransform: "uppercase", color: token("ink-subtle") }}>{`Draft ${VERSION}`}</div>
        <div style={{ fontSize: 64, lineHeight: "76px", fontWeight: 600, letterSpacing: -1.28, textWrap: "balance" }}>{TAGLINE}</div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 28,
          borderTop: `2px solid ${token("line")}`,
          fontSize: 28,
          color: token("ink-muted"),
        }}
      >
        <div>{new URL(SITE_URL).host}</div>
        {/* The primary button of the site, for the action that the card leads to. */}
        <div
          style={{
            padding: "16px 32px",
            borderRadius: token("radius-md"),
            background: token("ink"),
            color: token("canvas"),
            fontWeight: 500,
          }}
        >
          Read the spec
        </div>
      </div>
    </div>,
    { width: OG_IMAGE.width, height: OG_IMAGE.height, fonts },
  );
}
