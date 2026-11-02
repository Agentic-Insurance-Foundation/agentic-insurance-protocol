import { join } from "node:path";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { createMcpHandler } from "@modelcontextprotocol/server";
import express from "express";
import { TEST_DATA, fictionalUrl, publicUrl } from "./config.js";
import { RULES_FILES } from "./generated/rules-files.js";
import { homePage } from "./home.js";
import { createServer, settings } from "./mcp.js";

const app = express();
app.use(express.json());

const mcp = toNodeHandler(createMcpHandler(() => createServer()));
app.all("/mcp", (req, res) => void mcp(req, res, req.body));

/** Each rules file at a public address, as `RulesFile.url` gives it. */
app.get("/rules/*path", (req, res) => {
  const path = (req.params as { path: string[] }).path.join("/");
  const content = RULES_FILES[path];
  if (content === undefined) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.type("text/markdown; charset=utf-8").send(content);
});

/** A page for a browser, and the same summary in JSON for any other client. */
app.get("/", (req, res) => {
  if (req.accepts(["json", "html"]) === "html") {
    res.type("html").send(homePage());
    return;
  }
  res.json({
    name: "AIP registry",
    status: TEST_DATA ? "test data: every register entry is fictional" : "no register read and no server listed yet",
    mcp: `${publicUrl()}/mcp`,
    rules: Object.keys(RULES_FILES).map((path) => `${publicUrl()}/rules/${path}`),
    settings: settings(),
  });
});

// On Vercel, the platform calls the app and its CDN serves public/. On this
// machine, the app serves public/ and listens itself.
if (!process.env.VERCEL) {
  app.use(express.static(join(import.meta.dirname, "..", "public")));
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => {
    console.log(`AIP registry on ${publicUrl()}/mcp, ${TEST_DATA ? "with the test data" : "with no test data"}`);
    // Fails at start when FICTIONAL_ORIGIN has no {label}.
    if (process.env.FICTIONAL_ORIGIN) console.log(`Example Pets at ${fictionalUrl("pets", "/mcp")}`);
  });
}

export default app;
