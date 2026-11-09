#!/usr/bin/env node
// Runs Lighthouse and prints a short report: scores, Core Web Vitals (lab) with Google thresholds, the LCP element,
// top performance insights by estimated savings, and the top failing audits of the other categories.
// Built for Lighthouse 13 (performance "insights" have weight 0, so they are read separately).
//
// Usage: node scripts/lighthouse-summary.mjs [url, default http://localhost:3001] [--desktop] [--runs 3]
//        node scripts/lighthouse-summary.mjs --ping [url]
// Run it against a production build (`pnpm build` + `pnpm start`) — dev mode gives misleading performance.
// Requires devDependencies: lighthouse, playwright (its Chromium is used if CHROME_PATH is not set).
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, existsSync, copyFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const args = process.argv.slice(2);
const ping = args.includes("--ping");
const desktop = args.includes("--desktop");
const runsArg = args.indexOf("--runs");
const runs = Math.min(5, Math.max(1, runsArg === -1 ? 1 : Number(args[runsArg + 1]) || 1));
// Default = the production build (`pnpm prod` → next start -p 3001). Lighthouse on the dev server (3000) is meaningless.
const url = args.find((a) => a.startsWith("http")) ?? "http://localhost:3001";

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
if (/:3000\b/.test(url)) console.log("WARNING: port 3000 is usually the dev server — Performance and SEO (noindex) will be wrong. Use `pnpm prod` (3001).");

// ---------- Lighthouse + Node version ----------
const require = createRequire(join(process.cwd(), "package.json"));
let lhCli, lhPkg;
try {
  const pkgPath = require.resolve("lighthouse/package.json");
  lhPkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const bin = typeof lhPkg.bin === "string" ? lhPkg.bin : lhPkg.bin.lighthouse;
  lhCli = join(dirname(pkgPath), bin);
} catch {
  console.log("Lighthouse not installed: run `pnpm add -D lighthouse`");
  process.exit(2);
}
const ver = (s) => String(s).replace(/^[^\d]*/, "").split(".").map(Number);
const atLeast = (have, need) => {
  for (let i = 0; i < 3; i++) if ((have[i] || 0) !== (need[i] || 0)) return (have[i] || 0) > (need[i] || 0);
  return true;
};
const needNode = (lhPkg.engines?.node || "").match(/\d+(\.\d+){0,2}/)?.[0];
if (needNode && !atLeast(ver(process.versions.node), ver(needNode))) {
  console.log(`NODE TOO OLD: Lighthouse ${lhPkg.version} needs Node ${needNode}+, this is ${process.versions.node}. Install the current Node LTS from nodejs.org.`);
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

// ---------- run (1..5 times) ----------
mkdirSync(".qa", { recursive: true });
const kind = desktop ? "desktop" : "mobile";
const reports = [];
for (let i = 1; i <= runs; i++) {
  const out = join(".qa", runs > 1 ? `lighthouse-${kind}-${i}.json` : `lighthouse-${kind}.json`);
  const flags = [
    lhCli, url, "--quiet", "--output=json", `--output-path=${out}`,
    "--only-categories=performance,accessibility,best-practices,seo",
    "--chrome-flags=--headless=new --no-sandbox",
  ];
  if (desktop) flags.push("--preset=desktop");
  try {
    execFileSync(process.execPath, flags, { stdio: ["ignore", "ignore", "pipe"], env, timeout: 180000 });
  } catch (e) {
    const msg = String(e.stderr || e.message).split("\n").filter(Boolean).slice(-3).join(" | ");
    console.log(`LIGHTHOUSE FAILED (run ${i}): ${msg}`);
    process.exit(2);
  }
  reports.push({ out, lhr: JSON.parse(readFileSync(out, "utf8")) });
}
// The run with the median performance score is the one we describe.
const perf = (r) => r.lhr.categories.performance?.score ?? 0;
const sorted = [...reports].sort((a, b) => perf(a) - perf(b));
const { lhr, out } = sorted[Math.floor((sorted.length - 1) / 2)];
const reportPath = join(".qa", `lighthouse-${kind}.json`);
if (out !== reportPath) copyFileSync(out, reportPath);

// ---------- scores ----------
const score = (s) => (s === null || s === undefined ? "n/a" : Math.round(s * 100));
console.log(`LIGHTHOUSE ${lhr.lighthouseVersion} — ${kind} — ${url}${runs > 1 ? ` — median of ${runs} runs` : ""}`);
const cats = Object.values(lhr.categories);
console.log(
  cats
    .map((c) => {
      if (c.id === "performance" && runs > 1) {
        const all = reports.map((r) => score(perf(r)));
        return `${c.title} ${score(c.score)} (${Math.min(...all)}–${Math.max(...all)})`;
      }
      return `${c.title} ${score(c.score)}`;
    })
    .join(" · ")
);

// ---------- Core Web Vitals (lab) ----------
// Google thresholds: good / needs improvement / poor. TBT is the lab stand-in for INP.
const METRICS = [
  ["largest-contentful-paint", "LCP", 2500, 4000, "ms"],
  ["cumulative-layout-shift", "CLS", 0.1, 0.25, ""],
  ["total-blocking-time", "TBT", 200, 600, "ms"],
  ["first-contentful-paint", "FCP", 1800, 3000, "ms"],
  ["speed-index", "SI", 3400, 5800, "ms"],
];
const fmt = (v, unit) => (unit === "ms" ? (v >= 1000 ? `${(v / 1000).toFixed(1)} s` : `${Math.round(v)} ms`) : v.toFixed(3));
const line = METRICS.map(([id, name, good, poor, unit]) => {
  const v = lhr.audits[id]?.numericValue;
  if (v === undefined) return `${name} n/a`;
  const mark = v <= good ? "✓" : v <= poor ? "⚠" : "✗";
  return `${name} ${fmt(v, unit)} ${mark}`;
}).join(" · ");
console.log(`Metrics (lab): ${line}   (✓ good · ⚠ needs improvement · ✗ poor)`);
console.log("INP is measured only on real visitors — after deploy check PageSpeed Insights (field data) or Vercel Speed Insights; TBT above is its lab stand-in.");

// LCP element + what slows it down
const nodeOf = (a) => a?.details?.items?.find?.((i) => i.type === "node");
const lcpNode = nodeOf(lhr.audits["lcp-breakdown-insight"]) || nodeOf(lhr.audits["lcp-discovery-insight"]);
if (lcpNode) console.log(`LCP element: ${lcpNode.snippet || lcpNode.selector}`);
const parts = lhr.audits["lcp-breakdown-insight"]?.details?.items?.find?.((i) => i.type === "table")?.items;
if (parts?.length) console.log(`LCP breakdown: ${parts.map((p) => `${p.label} ${Math.round(p.duration)} ms`).join(" · ")}`);
const checklist = lhr.audits["lcp-discovery-insight"]?.details?.items?.find?.((i) => i.type === "checklist")?.items;
if (checklist) {
  const missing = Object.values(checklist).filter((c) => c.value === false).map((c) => c.label);
  if (missing.length) console.log(`LCP request — not met: ${missing.join("; ")}`);
}

// ---------- performance insights + diagnostics by estimated savings ----------
const perfRefs = lhr.categories.performance?.auditRefs ?? [];
const bytesOf = (a) => {
  const d = a.details || {};
  if (typeof d.overallSavingsBytes === "number") return d.overallSavingsBytes;
  if (typeof d.debugData?.wastedBytes === "number") return d.debugData.wastedBytes;
  return (d.items || []).reduce((s, i) => s + (typeof i.wastedBytes === "number" ? i.wastedBytes : 0), 0);
};
const kb = (b) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);
const insights = perfRefs
  .filter((r) => r.group === "insights" || r.group === "diagnostics")
  .map((r) => ({ id: r.id, a: lhr.audits[r.id] }))
  .filter(({ id, a }) => a && a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== "informative"
    && a.scoreDisplayMode !== "notApplicable" && !["lcp-breakdown-insight", "lcp-discovery-insight"].includes(id))
  .map(({ a }) => {
    const m = a.metricSavings || {};
    const ms = (m.LCP || 0) + (m.FCP || 0) + (m.TBT || 0) + (m.INP || 0);
    const cls = m.CLS || 0;
    const bytes = bytesOf(a);
    const save = [m.LCP ? `LCP −${Math.round(m.LCP)} ms` : "", m.FCP ? `FCP −${Math.round(m.FCP)} ms` : "", m.TBT ? `TBT −${Math.round(m.TBT)} ms` : "", cls ? `CLS −${cls.toFixed(3)}` : "", bytes ? kb(bytes) : ""].filter(Boolean).join(", ");
    return { title: a.title, value: a.displayValue || "", save, rank: ms + cls * 10000 + bytes / 1000 + (1 - a.score) };
  })
  .sort((x, y) => y.rank - x.rank);
if (insights.length) {
  console.log("Performance — what to fix (est. savings):");
  for (const i of insights.slice(0, 6)) console.log(`- ${i.title}${i.save ? ` — ${i.save}` : i.value ? ` — ${i.value}` : ""}`);
}

// ---------- other categories: failing weighted audits ----------
const fails = [];
for (const c of cats) {
  if (c.id === "performance") continue;
  for (const ref of c.auditRefs) {
    const a = lhr.audits[ref.id];
    if (!ref.weight || !a || a.score === null || a.score >= 0.9) continue;
    const n = a.details?.items?.length;
    fails.push({ cat: c.title, title: a.title, value: a.displayValue || (n ? `${n} element${n > 1 ? "s" : ""}` : ""), impact: ref.weight * (1 - a.score) });
  }
}
fails.sort((a, b) => b.impact - a.impact);
if (fails.length) {
  console.log("Other issues:");
  for (const f of fails.slice(0, 8)) console.log(`- [${f.cat}] ${f.title}${f.value ? ` (${f.value})` : ""}`);
}
if (!insights.length && !fails.length) console.log("No failing audits.");
console.log(`Full report: ${reportPath}`);
