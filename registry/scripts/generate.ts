import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const aip = join(root, "..");

const countries = join(aip, "skills", "agentic-insurance-protocol", "references", "countries");
const files = readdirSync(countries, { recursive: true, encoding: "utf8" })
  .filter((path) => path.endsWith(".md"))
  .sort();
const entries = files.map((path) => `  ${JSON.stringify(path)}: ${JSON.stringify(readFileSync(join(countries, path), "utf8"))},`);

writeFileSync(
  join(root, "src", "generated", "rules-files.ts"),
  `/** Each rules file of the skill, by its path under references/countries/, unchanged. */\nexport const RULES_FILES: Record<string, string> = {\n${entries.join("\n")}\n};\n`,
);

// The mark, the tokens and the fonts of the AIP Design System, as the site uses them.
// Vercel serves public/ from its CDN.
mkdirSync(join(root, "public", "fonts"), { recursive: true });
copyFileSync(join(aip, "website", "public", "aip-mark.svg"), join(root, "public", "aip-mark.svg"));
copyFileSync(join(aip, "website", "app", "tokens.css"), join(root, "public", "tokens.css"));
for (const font of ["IBMPlexSans-Variable.woff2", "IBMPlexMono-Regular.woff2"]) {
  copyFileSync(join(aip, "website", "app", "fonts", font), join(root, "public", "fonts", font));
}
const touchIcon = readFileSync(join(aip, "website", "app", "apple-icon.png"));
writeFileSync(join(root, "public", "apple-touch-icon.png"), touchIcon);

// favicon.ico: one image, the PNG of the touch icon, in an ICO container.
const header = Buffer.alloc(6);
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // one image
const entry = Buffer.alloc(16);
entry.writeUInt8(touchIcon.readUInt32BE(16) % 256, 0); // width from the PNG header, 0 means 256
entry.writeUInt8(touchIcon.readUInt32BE(20) % 256, 1); // height
entry.writeUInt16LE(1, 4); // colour planes
entry.writeUInt16LE(32, 6); // bits per pixel
entry.writeUInt32LE(touchIcon.length, 8);
entry.writeUInt32LE(header.length + entry.length, 12);
writeFileSync(join(root, "public", "favicon.ico"), Buffer.concat([header, entry, touchIcon]));

console.log(`registry: ${files.length} rules files and the mark`);
