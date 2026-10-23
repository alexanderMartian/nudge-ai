#!/usr/bin/env node
// Compact visual QA for Claude Code subagents.
// Usage: node scripts/visual-check.mjs [baseUrl] [paths...]   e.g. node scripts/visual-check.mjs http://localhost:3000 / /privacy
//        node scripts/visual-check.mjs --ping [baseUrl]
// Saves full-page screenshots to .qa/screenshots and prints a short report (keeps tokens low).
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const ping = args.includes("--ping");
const rest = args.filter((a) => a !== "--ping");
const base = rest[0]?.startsWith("http") ? rest.shift() : "http://localhost:3000";
const paths = rest.length ? rest : ["/"];
const WIDTHS = [375, 768, 1440];
const OUT = join(".qa", "screenshots");

async function isUp(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    return res.status < 500;
  } catch {
    return false;
  }
}

if (!(await isUp(base))) {
  console.log(`SERVER DOWN: ${base} is not reachable`);
  process.exit(2);
}
if (ping) {
  console.log(`SERVER UP: ${base}`);
  process.exit(0);
}

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.log("Playwright not installed: run `pnpm add -D playwright` and `pnpm exec playwright install chromium`");
  process.exit(2);
}

mkdirSync(OUT, { recursive: true });
// CHROME_PATH lets you use an installed Chrome instead of Playwright's Chromium.
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
let total = 0;

for (const path of paths) {
  const slug = path === "/" ? "home" : path.replace(/^\/+|\/+$/g, "").replace(/[^\w-]+/g, "-");
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const problems = [];
    page.on("console", (m) => m.type() === "error" && problems.push(`console: ${m.text().slice(0, 160)}`));
    page.on("pageerror", (e) => problems.push(`page error: ${String(e.message).slice(0, 160)}`));
    page.on("requestfailed", (r) => problems.push(`request failed: ${r.url().slice(0, 120)}`));
    page.on("response", (r) => r.status() >= 400 && problems.push(`HTTP ${r.status()}: ${r.url().slice(0, 120)}`));

    const url = new URL(path, base).toString();
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    } catch (e) {
      console.log(`[${width}] ${path}: cannot load (${e.message.split("\n")[0]})`);
      total++;
      await page.close();
      continue;
    }

    // Scroll through the page so lazy images and whileInView animations run.
    await page.evaluate(async () => {
      const step = Math.max(400, Math.floor(window.innerHeight * 0.8));
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(600);

    const r = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const overflowX = document.documentElement.scrollWidth > vw + 1;
      const label = (el) => {
        let s = el.tagName.toLowerCase();
        if (el.id) s += `#${el.id}`;
        const cls = typeof el.className === "string" ? el.className.trim().split(/\s+/).slice(0, 3).join(".") : "";
        if (cls) s += `.${cls}`;
        const text = (el.textContent || "").trim().slice(0, 30);
        return text ? `${s} "${text}"` : s;
      };
      const offenders = [];
      if (overflowX) {
        for (const el of document.querySelectorAll("body *")) {
          const b = el.getBoundingClientRect();
          if (b.width > 0 && b.height > 0 && (b.right > vw + 1 || b.left < -1)) {
            // skip children of an already reported element
            if (offenders.some((o) => o.el.contains(el))) continue;
            offenders.push({ el, text: label(el) });
            if (offenders.length >= 5) break;
          }
        }
      }
      const imgs = [...document.images];
      const broken = imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => (i.currentSrc || i.src).slice(0, 100));
      const noAlt = imgs.filter((i) => !i.hasAttribute("alt")).length;
      const h1 = document.querySelectorAll("h1").length;
      // Visible-size elements still invisible after scrolling (stuck animations)
      const hidden = [...document.querySelectorAll("section, section > *")]
        .filter((el) => {
          const s = getComputedStyle(el);
          const b = el.getBoundingClientRect();
          return b.height > 40 && Number(s.opacity) < 0.05;
        })
        .slice(0, 3)
        .map(label);
      return { overflowX, offenders: offenders.map((o) => o.text), broken, noAlt, h1, hidden };
    });

    if (r.overflowX) problems.push(`horizontal overflow; wider than viewport: ${r.offenders.join(" | ") || "unknown element"}`);
    if (r.broken.length) problems.push(`broken images: ${r.broken.join(", ")}`);
    if (r.noAlt) problems.push(`${r.noAlt} <img> without alt attribute`);
    if (r.h1 !== 1) problems.push(`${r.h1} <h1> elements (expected 1)`);
    if (r.hidden.length) problems.push(`invisible after scroll (opacity 0, stuck animation?): ${r.hidden.join(" | ")}`);

    const file = join(OUT, `${slug}-${width}.png`);
    await page.screenshot({ path: file, fullPage: true });
    await page.close();

    const unique = [...new Set(problems)];
    total += unique.length;
    console.log(unique.length ? `[${width}] ${path}: ${unique.length} issue(s) → ${file}` : `[${width}] ${path}: OK → ${file}`);
    for (const p of unique.slice(0, 8)) console.log(`   - ${p}`);
    if (unique.length > 8) console.log(`   … and ${unique.length - 8} more`);
  }
}

await browser.close();
console.log(total ? `RESULT: ${total} issue(s)` : "RESULT: OK");
process.exit(total ? 1 : 0);
