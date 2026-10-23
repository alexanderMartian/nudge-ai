#!/usr/bin/env node
// Runs Lighthouse and prints only scores + top failing audits (keeps tokens low).
// Usage: node scripts/lighthouse-summary.mjs [url] [--desktop]
//        node scripts/lighthouse-summary.mjs --ping [url]
// Requires devDependencies: lighthouse, playwright (its Chromium is used if Chrome is not found).
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const args = process.argv.slice(2);
const ping = args.includes("--ping");
const desktop = args.includes("--desktop");
const url = args.find((a) => a.startsWith("http")) ?? "http://localhost:3000";

try {
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (res.status >= 500) throw new Error();
} catch {
  console.log(`SERVER DOWN: ${url} is not reachable`);
  process.exit(2);
}
if (ping) {
  console.log(`SERVER UP: ${url}`);
  process.exit(0);
}

const require = createRequire(join(process.cwd(), "package.json"));
let lhCli;
try {
  const pkgPath = require.resolve("lighthouse/package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const bin = typeof pkg.bin === "string" ? pkg.bin : pkg.bin.lighthouse;
  lhCli = join(dirname(pkgPath), bin);
} catch {
  console.log("Lighthouse not installed: run `pnpm add -D lighthouse`");
  process.exit(2);
}

const env = { ...process.env };
if (!env.CHROME_PATH) {
  try {
    const { chromium } = await import("playwright");
    const p = chromium.executablePath();
    if (existsSync(p)) env.CHROME_PATH = p;
  } catch {
    /* fall back to system Chrome */
  }
}

mkdirSync(".qa", { recursive: true });
const out = join(".qa", desktop ? "lighthouse-desktop.json" : "lighthouse-mobile.json");
const flags = [
  lhCli,
  url,
  "--quiet",
  "--output=json",
  `--output-path=${out}`,
  "--only-categories=performance,accessibility,best-practices,seo",
  "--chrome-flags=--headless=new --no-sandbox",
];
if (desktop) flags.push("--preset=desktop");

try {
  execFileSync(process.execPath, flags, { stdio: ["ignore", "ignore", "pipe"], env, timeout: 180000 });
} catch (e) {
  const msg = String(e.stderr || e.message).split("\n").filter(Boolean).slice(-3).join(" | ");
  console.log(`LIGHTHOUSE FAILED: ${msg}`);
  process.exit(2);
}

const lhr = JSON.parse(readFileSync(out, "utf8"));
const cats = Object.values(lhr.categories);
const score = (s) => (s === null || s === undefined ? "n/a" : Math.round(s * 100));
console.log(`LIGHTHOUSE — ${desktop ? "desktop" : "mobile"} — ${url}`);
console.log(cats.map((c) => `${c.title} ${score(c.score)}`).join(" · "));

const fails = [];
for (const c of cats) {
  for (const ref of c.auditRefs) {
    const a = lhr.audits[ref.id];
    if (!ref.weight || !a || a.score === null || a.score >= 0.9) continue;
    fails.push({ cat: c.title, title: a.title, value: a.displayValue || "", impact: ref.weight * (1 - a.score) });
  }
}
fails.sort((a, b) => b.impact - a.impact);
if (fails.length) {
  console.log("Top issues:");
  for (const f of fails.slice(0, 10)) console.log(`- [${f.cat}] ${f.title}${f.value ? ` (${f.value})` : ""}`);
} else {
  console.log("No failing weighted audits.");
}
console.log(`Full report: ${out}`);
