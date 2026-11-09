#!/usr/bin/env node
// Checks ONE landing section against its Figma reference and responsive rules (used by the figma-import skill),
// or, with --page, the position of every section on the page.
//
// Usage:
//   node scripts/section-check.mjs <section-id> [--widths 360,768,1920] [--base http://localhost:3000] [--path /]
//   node scripts/section-check.mjs --page [--widths 360,1920] [--base …] [--path /]
//
// Inputs (optional, created by the figma-import skill):
//   design/<section-id>.png        Figma export of the section frame (scale 1)
//   design/<section-id>.spec.json  key values from Figma: { frame: { width, height }, elements: { "<data-spec key>": {...} } }
//   design/page.json               page map (--page): { pageWidth, sections: [{ id, nodeId, y, height, gapBefore, overlay? }] }
//
// Section mode: at the design width (spec.frame.width, default 1920) it measures every [data-spec] element against
// the spec, finds every text of spec.texts at its Figma position (±3 px, typo-tolerant), and makes a pixel diff
// with design/<id>.png (transparent parts of the reference are not compared; red zones are listed; > 10% = issue). At every width it runs layout rules (overflow, small text,
// tap targets, overlaps, clipped text, upscaled images, invisible blocks). A text height mismatch that matches the
// Figma "Vertical trim" signature gets a hint.
// Page mode: at the design width every built section must start at its Figma y (±2 px); at smaller widths sections
// that have a gap in Figma must not touch, and no section may overlap the next one.
// Output: a short text report + screenshots in .qa/sections/. Exit code 1 when anything is off.
import { mkdirSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_WIDTHS = [360, 768, 1024, 1280, 1440, 1920, 2560];
const OUT = join(".qa", "sections");

// ---------- args ----------
const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? undefined : argv[i + 1];
};
const VALUE_FLAGS = ["widths", "base", "path"];
const pageMode = argv.includes("--page");
const id = argv.find((a, i) => !a.startsWith("--") && !VALUE_FLAGS.includes(argv[i - 1]?.slice(2)));
if (!id && !pageMode) {
  console.log("Usage: node scripts/section-check.mjs <section-id> [--widths 360,1920] [--base http://localhost:3000] [--path /]");
  console.log("       node scripts/section-check.mjs --page [--widths 360,1920]");
  process.exit(2);
}
const base = flag("base") ?? "http://localhost:3000";
const url = new URL(flag("path") ?? "/", base).toString();

let pageMap = null;
if (pageMode) {
  const pagePath = join("design", "page.json");
  if (!existsSync(pagePath)) {
    console.log(`NO PAGE MAP: ${pagePath} is missing — figma-import step 1 writes it from the section frame bounds`);
    process.exit(2);
  }
  try {
    pageMap = JSON.parse(readFileSync(pagePath, "utf8"));
  } catch (e) {
    console.log(`PAGE MAP INVALID: ${pagePath} — ${e.message}`);
    process.exit(2);
  }
}

const specPath = join("design", `${id}.spec.json`);
const designPngPath = join("design", `${id}.png`);
let spec = null;
if (existsSync(specPath)) {
  try {
    spec = JSON.parse(readFileSync(specPath, "utf8"));
  } catch (e) {
    console.log(`SPEC INVALID: ${specPath} — ${e.message}`);
    process.exit(2);
  }
}
const designWidth = Number(spec?.frame?.width) || 1920;
// Where the Figma frame sits inside our full-width <section> (frames narrower than the page, overlays).
const frameX = Number(spec?.frame?.x) || 0;
const frameY = Number(spec?.frame?.y) || 0;
const pageWidth = pageMode
  ? Number(pageMap.pageWidth) || 1920
  : Number(spec?.frame?.pageWidth) || (frameX ? 1920 : designWidth); // viewport for the design check
const widths = (flag("widths") ? flag("widths").split(",").map(Number) : DEFAULT_WIDTHS)
  .map((w) => (w === 1920 && pageWidth !== 1920 ? pageWidth : w))
  .filter((w) => Number.isFinite(w) && w > 0)
  .sort((a, b) => a - b);

// ---------- server + playwright ----------
try {
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (res.status >= 500) throw new Error();
} catch {
  console.log(`SERVER DOWN: ${url} is not reachable — run \`pnpm dev\``);
  process.exit(2);
}

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.log("Playwright not installed: run `pnpm add -D playwright` and `pnpm exec playwright install chromium`");
  process.exit(2);
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});

// Hide the Next.js dev indicator and freeze CSS motion so screenshots are stable.
const FREEZE_CSS = `
  nextjs-portal, [data-nextjs-toast], [data-next-badge-root] { display: none !important; }
  *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }
`;

// ---------- in-page helpers (plain JS, run inside the browser) ----------
const PAGE_HELPERS = () => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  // Any CSS color (rgb, oklch, color(...)) -> "#rrggbb" or "transparent".
  window.__toHex = (css) => {
    if (!css || css === "transparent") return "transparent";
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    if (a === 0) return "transparent";
    return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
  };
  window.__visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    const s = getComputedStyle(el);
    return s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0.05;
  };
  window.__label = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.dataset.spec) s += `[${el.dataset.spec}]`;
    else if (el.id) s += `#${el.id}`;
    else if (typeof el.className === "string" && el.className.trim()) s += "." + el.className.trim().split(/\s+/).slice(0, 2).join(".");
    const t = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 24);
    return t ? `${s} "${t}"` : s;
  };
  window.__textLeaves = (root) =>
    [...root.querySelectorAll("*")].filter(
      (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && window.__visible(el)
    );
};

async function preparePage(width) {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  await page.addStyleTag({ content: FREEZE_CSS });
  await page.evaluate(PAGE_HELPERS);
  await page.evaluate(() => document.fonts.ready);
  if (pageMode) {
    // Scroll the whole page so lazy images load and layout settles, then back to top.
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 700) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      const imgs = [...document.images];
      await Promise.race([
        Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; })))),
        new Promise((r) => setTimeout(r, 5000)),
      ]);
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(250);
    return { context, page, section: null };
  }
  const exists = await page.evaluate((sid) => !!document.getElementById(sid), id);
  if (!exists) return { context, page, section: null };
  // Scroll through the section so lazy images load, then back to top.
  await page.evaluate(async (sid) => {
    const el = document.getElementById(sid);
    const top = el.getBoundingClientRect().top + window.scrollY;
    const bottom = top + el.offsetHeight;
    for (let y = Math.max(0, top - 200); y < bottom; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    const imgs = [...el.querySelectorAll("img")];
    await Promise.race([
      Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; })))),
      new Promise((r) => setTimeout(r, 5000)),
    ]);
    window.scrollTo(0, 0);
  }, id);
  await page.waitForTimeout(250);
  return { context, page, section: page.locator(`#${id}`) };
}

// ---------- spec measurement ----------
async function measure(page, keys) {
  return page.evaluate(
    ({ sid, keys }) => {
      const section = document.getElementById(sid);
      const sr = section.getBoundingClientRect();
      const px = (v) => (v === "normal" ? "normal" : Math.round(parseFloat(v) * 100) / 100);
      const out = {};
      for (const key of keys) {
        const el = key === sid ? section : section.querySelector(`[data-spec="${key}"]`);
        if (!el) { out[key] = null; continue; }
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        const row = s.display.includes("flex") && !s.flexDirection.startsWith("column");
        out[key] = {
          x: Math.round(r.left - sr.left), y: Math.round(r.top - sr.top), w: Math.round(r.width), h: Math.round(r.height),
          fontSize: px(s.fontSize), lineHeight: px(s.lineHeight), fontWeight: Number(s.fontWeight),
          letterSpacing: s.letterSpacing === "normal" ? 0 : px(s.letterSpacing), fontFamily: s.fontFamily,
          color: window.__toHex(s.color), bg: window.__toHex(s.backgroundColor),
          radius: px(s.borderTopLeftRadius),
          paddingTop: px(s.paddingTop), paddingRight: px(s.paddingRight), paddingBottom: px(s.paddingBottom), paddingLeft: px(s.paddingLeft),
          gap: px(row ? s.columnGap : s.rowGap), rowGap: px(s.rowGap), columnGap: px(s.columnGap),
          isText: [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()),
          trimmed: /trim/.test(s.textBoxTrim || s.getPropertyValue("text-box-trim") || "") && !/none/.test(s.textBoxTrim || ""),
        };
      }
      return out;
    },
    { sid: id, keys }
  );
}

const DIFF_LIMIT = 10; // % — above it the section is not done until the red zones are explained
const TOL = { x: 2, y: 2, w: 2, h: 2, fontSize: 0.5, lineHeight: 1, letterSpacing: 0.3, radius: 1, gap: 2, rowGap: 2, columnGap: 2, paddingTop: 2, paddingRight: 2, paddingBottom: 2, paddingLeft: 2 };
const hexDist = (a, b) => {
  if (a === b) return 0;
  if (a === "transparent" || b === "transparent" || !/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) return 999;
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return Math.max(...x.map((v, i) => Math.abs(v - y[i])));
};

function compareSpec(specEls, measured) {
  const fails = [];
  let checks = 0;
  for (const [key, want] of Object.entries(specEls)) {
    const got = measured[key];
    if (!got) { fails.push(`${key}: element with data-spec="${key}" not found`); continue; }
    for (const [prop, exp] of Object.entries(want)) {
      if (exp === null || exp === undefined || prop.startsWith("_")) continue;
      checks++;
      const act = prop === "x" ? got.x - frameX : prop === "y" ? got.y - frameY : got[prop];
      let ok;
      if (prop === "color" || prop === "bg") ok = hexDist(String(exp).toLowerCase(), act) <= 3;
      else if (prop === "fontFamily") ok = sameFamily(act, exp);
      else if (prop === "fontWeight") ok = Number(exp) === act;
      else if (prop in TOL) ok = typeof act === "number" && Math.abs(act - Number(exp)) <= TOL[prop];
      else { checks--; continue; } // unknown prop: ignore
      if (!ok) fails.push(`${key} ${prop}: ours ${act} ≠ design ${exp}${prop === "h" ? trimHint(got, Number(exp)) : ""}`);
    }
  }
  return { checks, fails };
}

// Font family: Figma names the family ("Reggae One"); next/font names it after the variable — Google fonts keep the
// real name ("'Playfair Display', 'Playfair Display Fallback'"), next/font/local uses the JS name ("reggae, 'reggae Fallback'").
// Compare letters only and accept a computed name that is the start of the design name (reggae → reggaeone).
function sameFamily(act, exp) {
  const norm = (x) => String(x).toLowerCase().replace(/[^a-z0-9]/g, "");
  const want = norm(exp);
  const names = String(act).split(",").map(norm).filter((n) => n && !n.endsWith("fallback"));
  return names.some((n) => n === want || n.includes(want) || (n.length >= 4 && want.startsWith(n)));
}

// Figma "Vertical trim: Cap height to baseline" makes a text box shorter than lines × lineHeight:
// trimmed height = (lines − 1) × lineHeight + cap height (≈ 0.62–0.78 × fontSize, font-dependent).
// Bridge doesn't export it, so recognise it by the numbers.
function trimHint(got, want) {
  const lh = Number(got.lineHeight), fs = Number(got.fontSize);
  if (!got.isText || !(lh > 0) || !(fs > 0) || got.trimmed || want >= got.h) return "";
  const lines = Math.max(1, Math.round(got.h / lh));
  const lo = (lines - 1) * lh + 0.62 * fs - 2;
  const hi = (lines - 1) * lh + 0.78 * fs + 2;
  if (want >= lo && want <= hi)
    return ` → looks like Figma Vertical trim (cap height to baseline): add [text-box:trim-both_cap_alphabetic]; ask the user to confirm in Figma (Typography → Type settings → Vertical trim)`;
  if (want > hi && want < lines * lh)
    return ` → text box shorter than ${lines} × ${lh} but taller than trimmed text: maybe Vertical trim + fixed-height box, or wrapping differs — ask the user to check Vertical trim and resizing (Hug / Fixed) in Figma`;
  return "";
}

// ---------- text map: every Figma text must be on the page at its place ----------
// spec.texts = [{ text, x, y, w?, align? }] — x/y/w of the Figma text box relative to the frame,
// align = LEFT | CENTER | RIGHT (textAlignHorizontal). Texts are matched by similarity, so a fixed typo
// ("prodcts" → "products") still finds its element; each element is used once.
const TEXT_TOL = 3;
async function checkTexts(page, texts) {
  const found = await page.evaluate(
    ({ sid, texts, fx, fy }) => {
      const section = document.getElementById(sid);
      const sr = section.getBoundingClientRect();
      const norm = (s) => String(s).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();
      const grams = (s) => { const g = new Map(); const t = ` ${s} `; for (let i = 0; i < t.length - 1; i++) { const k = t.slice(i, i + 2); g.set(k, (g.get(k) || 0) + 1); } return g; };
      const sim = (a, b) => {
        if (a === b) return 1;
        const A = grams(a), B = grams(b); let both = 0, n = 0;
        for (const [k, v] of A) { both += Math.min(v, B.get(k) || 0); n += v; }
        for (const v of B.values()) n += v;
        return n ? (2 * both) / n : 0;
      };
      // Text leaves plus their parents: a text split into spans (logo "C" + "offee") is matched as a whole.
      const base = window.__textLeaves(section);
      const els = [...new Set([...base, ...base.map((e) => e.parentElement).filter((p) => p && section.contains(p) && p !== section && (p.textContent || "").trim().length <= 80)])];
      const leaves = els.map((el) => {
        const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(" ");
        const range = document.createRange(); range.selectNodeContents(el);
        const rr = range.getBoundingClientRect(), er = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        // Top of the text's first line box = what Figma calls the text node's y. The element box is not it:
        // a button or a link with padding / flex centering has its text lower than its own top.
        let top;
        if (/trim/.test(s.textBoxTrim || "") && !/none/.test(s.textBoxTrim || "")) {
          top = er.top + parseFloat(s.borderTopWidth) + parseFloat(s.paddingTop); // trimmed box = Figma's trimmed box
        } else {
          const first = range.getClientRects()[0] || rr;
          const lh = parseFloat(s.lineHeight);
          top = Number.isFinite(lh) ? first.top - (lh - first.height) / 2 : first.top;
        }
        return {
          el, label: window.__label(el), t: norm(el.textContent || own),
          left: rr.left - sr.left - fx, right: rr.right - sr.left - fx,
          top: top - sr.top - fy,
        };
      });
      const used = new Set();
      return texts.map((want) => {
        const t = norm(want.text);
        const ax = String(want.align || "LEFT").toUpperCase();
        const wx = ax === "CENTER" ? want.x + (want.w || 0) / 2 : ax === "RIGHT" ? want.x + (want.w || 0) : want.x;
        let best = null;
        for (const l of leaves) {
          if (used.has(l)) continue;
          const s = sim(t, l.t);
          if (s < 0.6) continue;
          const lx = ax === "CENTER" ? (l.left + l.right) / 2 : ax === "RIGHT" ? l.right : l.left;
          const dist = Math.hypot(lx - wx, l.top - want.y);
          // prefer the most similar text; among equally similar ones the nearest
          if (!best || s > best.s + 0.05 || (Math.abs(s - best.s) <= 0.05 && dist < best.dist)) best = { l, s, lx, dist };
        }
        if (!best) return { text: want.text, missing: true };
        used.add(best.l);
        return { text: want.text, found: best.l.t, label: best.l.label, dx: Math.round(best.lx - wx), dy: Math.round(best.l.top - want.y), x: Math.round(best.lx), y: Math.round(best.l.top) };
      });
    },
    { sid: id, texts: texts.filter((t) => t && t.text), fx: frameX, fy: frameY }
  );
  return found.map((r) => {
    if (r.missing) return { ...r, fail: `"${r.text}": not found in the section` };
    const off = [];
    if (Math.abs(r.dx) > TEXT_TOL) off.push(`x ${r.dx > 0 ? "+" : ""}${r.dx}`);
    if (Math.abs(r.dy) > TEXT_TOL) off.push(`y ${r.dy > 0 ? "+" : ""}${r.dy}`);
    return off.length ? { ...r, fail: `"${r.text}" is off by ${off.join(", ")} px (ours x ${r.x} y ${r.y})` } : r;
  });
}

// ---------- pixel diff (in a blank page, no extra deps) ----------
async function pixelDiff(oursB64, designB64) {
  const page = await browser.newPage();
  const res = await page.evaluate(
    async ({ oursB64, designB64, fw, fx, fy }) => {
      const load = (b64) => new Promise((ok, err) => { const i = new Image(); i.onload = () => ok(i); i.onerror = err; i.src = "data:image/png;base64," + b64; });
      const [ours, design] = await Promise.all([load(oursB64), load(designB64)]);
      // Compare only the part of our section where the Figma frame sits (fx, fy, fw wide).
      const W = Math.min(fw, ours.naturalWidth - fx);
      const dScale = W / design.naturalWidth;
      const dH = Math.round(design.naturalHeight * dScale);
      // Offset frame (narrower than the section): compare only the frame's height; section padding around it is ours.
      const oursH = fx || fy ? Math.min(ours.naturalHeight - fy, dH) : ours.naturalHeight - fy;
      const H = Math.max(oursH, dH);
      const mk = () => { const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d", { willReadFrequently: true }); x.fillStyle = "#fff"; x.fillRect(0, 0, W, H); return [c, x]; };
      const [, a] = mk(); a.drawImage(ours, fx, fy, W, oursH, 0, 0, W, oursH);
      // Transparent parts of the reference (header over a photo, frames without a fill) show OUR pixels
      // underneath, so only what Figma actually paints is compared.
      const [, b] = mk(); b.drawImage(ours, fx, fy, W, oursH, 0, 0, W, oursH); b.drawImage(design, 0, 0, W, dH);
      const [, t] = mk(); t.clearRect(0, 0, W, H); t.drawImage(design, 0, 0, W, dH);
      const T = t.getImageData(0, 0, W, dH).data;
      let clear = 0;
      for (let p = 3; p < T.length; p += 4) if (T[p] < 128) clear++;
      const transparentPct = (clear / (W * dH)) * 100;
      const A = a.getImageData(0, 0, W, H).data, B = b.getImageData(0, 0, W, H).data;
      const [outC, o] = mk();
      const img = o.createImageData(W, H), D = img.data;
      const BAND = 40, bands = new Array(Math.ceil(H / BAND)).fill(0);
      const CELL = 20, cols = Math.ceil(W / CELL), cells = new Uint32Array(cols * Math.ceil(H / CELL));
      let diff = 0;
      for (let p = 0; p < A.length; p += 4) {
        const d = Math.max(Math.abs(A[p] - B[p]), Math.abs(A[p + 1] - B[p + 1]), Math.abs(A[p + 2] - B[p + 2]));
        const g = (B[p] * 0.3 + B[p + 1] * 0.59 + B[p + 2] * 0.11) * 0.35 + 165; // faded design as background
        if (d > 40) {
          diff++;
          const i = p / 4, y = Math.floor(i / W), x = i % W;
          bands[Math.floor(y / BAND)]++;
          cells[Math.floor(y / CELL) * cols + Math.floor(x / CELL)]++;
          D[p] = 230; D[p + 1] = 30; D[p + 2] = 30;
        } else { D[p] = D[p + 1] = D[p + 2] = g; }
        D[p + 3] = 255;
      }
      o.putImageData(img, 0, 0);
      const top = bands
        .map((n, i) => ({ from: i * BAND, to: Math.min(H, (i + 1) * BAND), pct: (n / (W * BAND)) * 100 }))
        .filter((x) => x.pct >= 5)
        .sort((x, y) => y.pct - x.pct)
        .slice(0, 3);
      // Red zones: 20px cells with ≥ 8% red pixels, joined with their neighbours → bounding boxes.
      const hot = (k) => cells[k] >= CELL * CELL * 0.08;
      const seen = new Uint8Array(cells.length), zones = [];
      for (let k = 0; k < cells.length; k++) {
        if (seen[k] || !hot(k)) continue;
        const stack = [k]; seen[k] = 1;
        let x1 = Infinity, y1 = Infinity, x2 = -1, y2 = -1, n = 0;
        while (stack.length) {
          const c = stack.pop(), cx = c % cols, cy = Math.floor(c / cols);
          n += cells[c]; x1 = Math.min(x1, cx); x2 = Math.max(x2, cx); y1 = Math.min(y1, cy); y2 = Math.max(y2, cy);
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
            const nx = cx + dx, ny = cy + dy, nk = ny * cols + nx;
            if (nx >= 0 && nx < cols && ny >= 0 && nk < cells.length && !seen[nk] && hot(nk)) { seen[nk] = 1; stack.push(nk); }
          }
        }
        zones.push({ x1: x1 * CELL, y1: y1 * CELL, x2: Math.min(W, (x2 + 1) * CELL), y2: Math.min(H, (y2 + 1) * CELL), n });
      }
      zones.sort((p, q) => q.n - p.n);
      return { pct: (diff / (W * H)) * 100, oursH, designH: dH, top, zones: zones.slice(0, 5), transparentPct, png: outC.toDataURL("image/png").split(",")[1] };
    },
    { oursB64, designB64, fw: designWidth, fx: frameX, fy: frameY }
  );
  await page.close();
  return res;
}

// ---------- layout rules ----------
async function rules(page, width) {
  return page.evaluate(
    async ({ sid, width }) => {
      const section = document.getElementById(sid);
      const vw = document.documentElement.clientWidth;
      const issues = [];
      const all = [...section.querySelectorAll("*")].filter(window.__visible);

      // 1. horizontal overflow of the page caused by this section
      if (document.documentElement.scrollWidth > vw + 1) {
        const off = all.filter((el) => { const r = el.getBoundingClientRect(); return r.right > vw + 1 || r.left < -1; });
        const top = off.filter((el) => !off.some((o) => o !== el && o.contains(el))).slice(0, 3);
        if (top.length) issues.push(`overflow-x: ${top.map((el) => `${window.__label(el)} (right ${Math.round(el.getBoundingClientRect().right)})`).join(" | ")}`);
      }
      const texts = window.__textLeaves(section);
      // 2. text cut by an overflow-hidden/clip ancestor or by ellipsis.
      //    Text inside a horizontal scroller (carousel) that is just scrolled out of view is not "cut".
      const clipped = texts.filter((el) => {
        const r = el.getBoundingClientRect();
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          const s = getComputedStyle(p);
          if (/(auto|scroll)/.test(s.overflowX) && p.scrollWidth > p.clientWidth + 1) {
            const pr = p.getBoundingClientRect();
            if (r.right > pr.right + 1 || r.left < pr.left - 1) return false;
          }
          if (/(hidden|clip)/.test(s.overflowX + s.overflowY)) {
            const pr = p.getBoundingClientRect();
            if (r.right > pr.right + 1 || r.left < pr.left - 1 || r.bottom > pr.bottom + 1) return true;
          }
          if (p === section) break;
        }
        return el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).textOverflow === "ellipsis";
      });
      if (clipped.length) issues.push(`text cut off: ${clipped.slice(0, 3).map(window.__label).join(" | ")}`);
      // 3. small text
      const small = texts.filter((el) => parseFloat(getComputedStyle(el).fontSize) < 14 && !el.closest("[data-allow-small]"));
      if (small.length) issues.push(`text < 14px: ${small.slice(0, 3).map((el) => `${window.__label(el)} ${getComputedStyle(el).fontSize}`).join(" | ")}`);
      // 4. tap targets (touch widths only; inline links inside text are exempt)
      if (width < 1024) {
        const tap = all.filter((el) => el.matches("a[href], button, input:not([type=hidden]), select, textarea, [role=button], summary"))
          .filter((el) => getComputedStyle(el).display !== "inline")
          // Not for people: honeypots / hidden controls (aria-hidden, inert, tabindex=-1 off-screen).
          .filter((el) => !el.closest("[aria-hidden=true], [inert]"))
          .filter((el) => { const r = el.getBoundingClientRect(); return !(el.tabIndex < 0 && (r.right <= 0 || r.left >= innerWidth)); })
          .filter((el) => { const r = el.getBoundingClientRect(); return r.width < 44 || r.height < 44; });
        if (tap.length) issues.push(`tap target < 44px: ${tap.slice(0, 3).map((el) => { const r = el.getBoundingClientRect(); return `${window.__label(el)} ${Math.round(r.width)}×${Math.round(r.height)}`; }).join(" | ")}`);
      }
      // 4b. pointer cursor on everything clickable (mouse widths only). Tailwind v4 gives buttons cursor: default.
      if (width >= 1024) {
        const noPointer = all
          .filter((el) => el.matches("a[href], button:not(:disabled), [role=button], summary, label[for], select, input[type=submit], input[type=button], input[type=checkbox], input[type=radio]"))
          .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2; }) // skip sr-only labels
          .filter((el) => getComputedStyle(el).cursor !== "pointer");
        if (noPointer.length) issues.push(`no pointer cursor (clickable): ${noPointer.slice(0, 4).map(window.__label).join(" | ")}`);
      }
      // 5. overlapping texts
      const pairs = [];
      const list = texts.filter((el) => !el.closest("[data-allow-overlap]")).slice(0, 200);
      for (let i = 0; i < list.length && pairs.length < 3; i++) {
        for (let j = i + 1; j < list.length && pairs.length < 3; j++) {
          const a = list[i], b = list[j];
          if (a.contains(b) || b.contains(a)) continue;
          const r1 = a.getBoundingClientRect(), r2 = b.getBoundingClientRect();
          const ix = Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left);
          const iy = Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top);
          if (ix > 2 && iy > 2 && ix * iy > 16) pairs.push(`${window.__label(a)} × ${window.__label(b)}`);
        }
      }
      if (pairs.length) issues.push(`overlapping text: ${pairs.join(" | ")}`);
      // 6. upscaled (blurry) images. With srcset, img.naturalWidth is density-corrected (e.g. a 2560px original served
      //    for a 3840w candidate reports 1706), so the real pixel width is read from the file itself (cached request).
      const realWidth = (i) => new Promise((done) => {
        if (!i.srcset) return done(i.naturalWidth);
        const probe = new Image();
        probe.onload = () => done(probe.naturalWidth);
        probe.onerror = () => done(i.naturalWidth);
        probe.src = i.currentSrc || i.src;
      });
      const up = [];
      for (const i of [...section.querySelectorAll("img")].filter(window.__visible)) {
        if (!i.naturalWidth) continue;
        const w = await realWidth(i);
        const shown = i.getBoundingClientRect().width;
        if (shown > w * 1.05) up.push(`${decodeURIComponent(i.currentSrc || i.src).split("/").pop().slice(0, 40)} ${w}px→${Math.round(shown)}px`);
      }
      if (up.length) issues.push(`image upscaled: ${up.slice(0, 2).join(" | ")}`);
      // 7. invisible blocks (stuck enter animation)
      const ghost = [...section.querySelectorAll("*")].filter((el) => { const r = el.getBoundingClientRect(); return r.height > 40 && Number(getComputedStyle(el).opacity) < 0.05; });
      if (ghost.length) issues.push(`invisible (opacity 0): ${ghost.slice(0, 2).map(window.__label).join(" | ")}`);
      return issues;
    },
    { sid: id, width }
  );
}

// ---------- hover states (design width, mouse) ----------
// Every button / link should visibly react to the mouse (color, background, opacity, underline, shadow, transform…),
// even when Figma has no hover state drawn.
async function hoverCheck(page) {
  const SEL = "a[href], button:not(:disabled), [role=button]";
  const handles = await page.$$(`#${id} :is(${SEL})`);
  const look = (el) => {
    const pick = (e) => { const s = getComputedStyle(e); return [s.color, s.backgroundColor, s.opacity, s.textDecorationLine, s.boxShadow, s.transform, s.borderColor, s.filter, s.outlineStyle].join("|"); };
    return [pick(el), ...[...el.querySelectorAll("*")].slice(0, 6).map(pick)].join("#");
  };
  const none = [];
  for (const h of handles.slice(0, 16)) {
    const visible = await h.evaluate((el) => window.__visible(el));
    if (!visible) continue;
    const before = await h.evaluate(look);
    try { await h.hover({ timeout: 1500 }); } catch { continue; }
    await page.waitForTimeout(30);
    const after = await h.evaluate(look);
    if (before === after) none.push(await h.evaluate((el) => window.__label(el)));
    await page.mouse.move(0, 0);
  }
  return none;
}

// ---------- page mode ----------
// Positions of all sections from design/page.json. y in the map is relative to the top of the design frame.
async function pagePositions(page, ids) {
  return page.evaluate((ids) => {
    const out = {};
    for (const sid of ids) {
      const el = document.getElementById(sid);
      if (!el) { out[sid] = null; continue; }
      const r = el.getBoundingClientRect();
      out[sid] = { top: Math.round(r.top + window.scrollY), bottom: Math.round(r.bottom + window.scrollY), h: Math.round(r.height) };
    }
    return out;
  }, ids);
}

async function runPage() {
  const all = (pageMap.sections ?? []).filter((s) => s && s.id);
  const flow = all.filter((s) => !s.overlay);
  const TOLP = 2;
  let issues = 0;
  console.log(`PAGE — ${url} — ${flow.length} sections in design/page.json, design ${pageWidth}px`);
  const notBuilt = new Set();

  for (const width of widths) {
    const { context, page } = await preparePage(width);
    const pos = await pagePositions(page, all.map((s) => s.id));
    const built = flow.filter((s) => pos[s.id]);
    for (const s of flow) if (!pos[s.id]) notBuilt.add(s.id);
    const lines = [];

    // DOM order must follow the design order.
    const order = [...built].sort((a, b) => pos[a.id].top - pos[b.id].top).map((s) => s.id);
    const want = built.map((s) => s.id);
    if (order.join() !== want.join()) lines.push(`   - order: ours ${order.join(" → ")} ≠ design ${want.join(" → ")}`);

    if (width === pageWidth) {
      // Exact positions. Report the first section where the difference appears — everything below shifts with it.
      let firstOff = null;
      const rows = [];
      for (const s of built) {
        const d = pos[s.id].top - Number(s.y);
        rows.push(`${s.id} ${pos[s.id].top}/${s.y}${Math.abs(d) > TOLP ? ` (${d > 0 ? "+" : ""}${d})` : ""}`);
        if (Math.abs(d) > TOLP && !firstOff) firstOff = { s, d };
      }
      lines.unshift(`   y ours/design: ${rows.join(" · ")}`);
      if (firstOff) {
        const i = built.indexOf(firstOff.s);
        const prev = built[i - 1];
        const why = prev
          ? `gap after ${prev.id}: ours ${pos[firstOff.s.id].top - pos[prev.id].bottom} ≠ design ${firstOff.s.gapBefore ?? Number(firstOff.s.y) - (Number(prev.y) + Number(prev.height))}` +
            (Math.abs(pos[prev.id].h - Number(prev.height)) > TOLP ? `; ${prev.id} height ours ${pos[prev.id].h} ≠ design ${prev.height}` : "")
          : "first section starts at the wrong place";
        lines.push(`   - ${firstOff.s.id} starts at y ${pos[firstOff.s.id].top} ≠ design ${firstOff.s.y} (${firstOff.d > 0 ? "+" : ""}${firstOff.d}px): ${why}`);
      }
    }

    // Every width: no overlaps; sections with a gap in Figma must not touch.
    for (let i = 1; i < built.length; i++) {
      const prev = built[i - 1], cur = built[i];
      if (flow.indexOf(cur) !== flow.indexOf(prev) + 1) continue; // a section between them is not built yet
      const gap = pos[cur.id].top - pos[prev.id].bottom;
      const designGap = cur.gapBefore ?? Number(cur.y) - (Number(prev.y) + Number(prev.height));
      if (gap < -1) lines.push(`   - ${cur.id} overlaps ${prev.id} by ${-gap}px`);
      else if (designGap > 0 && gap <= 0) lines.push(`   - ${cur.id} touches ${prev.id}: gap 0, design ${designGap}px (mt-section-* missing?)`);
    }

    const bad = lines.some((l) => l.startsWith("   - "));
    issues += lines.filter((l) => l.startsWith("   - ")).length;
    console.log(`[${width}] ${bad ? "ISSUES" : "OK"} · ${built.length}/${flow.length} sections on the page`);
    for (const l of lines) console.log(l);
    await context.close();
  }
  if (notBuilt.size) console.log(`Not built yet (skipped): ${[...notBuilt].join(", ")}`);
  await browser.close();
  console.log(issues ? `RESULT: ${issues} issue(s)` : "RESULT: OK");
  process.exit(issues ? 1 : 0);
}
if (pageMode) await runPage();

// ---------- run ----------
let total = 0;
const atDesign = {}; // widths of spec elements at design width, for the "stretch" rule
const ruleHits = {}; // rule issue text -> widths where it occurred
console.log(`SECTION ${id} — ${url} — design ${designWidth}px${frameX || frameY ? ` at x${frameX} y${frameY}` : ""} in ${pageWidth}px${spec ? "" : " (no spec)"}`);

for (const width of widths) {
  const { context, page, section } = await preparePage(width);
  if (!section) {
    console.log(`[${width}] NOT FOUND: no element with id="${id}"`);
    total++;
    await context.close();
    continue;
  }
  const shot = join(OUT, `${id}-${width}.png`);
  const buf = await section.screenshot({ path: shot });
  const lines = [];

  if (width === pageWidth) {
    if (spec?.elements) {
      const keys = Object.keys(spec.elements);
      const m = await measure(page, keys);
      for (const k of keys) if (m[k]) atDesign[k] = m[k].w;
      const { checks, fails } = compareSpec(spec.elements, m);
      lines.push(`spec ${checks - fails.length}/${checks} OK`);
      for (const f of fails.slice(0, 12)) lines.push(`   - ${f}`);
      if (fails.length > 12) lines.push(`   … and ${fails.length - 12} more`);
      total += fails.length;
    }
    if (Array.isArray(spec?.texts) && spec.texts.length) {
      const res = await checkTexts(page, spec.texts);
      const fails = res.filter((r) => r.fail);
      lines.push(`${lines.length ? "   " : ""}texts ${res.length - fails.length}/${res.length} OK`);
      for (const r of fails.slice(0, 12)) lines.push(`   - ${r.fail}`);
      if (fails.length > 12) lines.push(`   … and ${fails.length - 12} more`);
      total += fails.length;
    }
    if (existsSync(designPngPath)) {
      const d = await pixelDiff(buf.toString("base64"), readFileSync(designPngPath).toString("base64"));
      const diffPath = join(OUT, `${id}-diff.png`);
      writeFileSync(diffPath, Buffer.from(d.png, "base64"));
      const bands = d.top.map((b) => `${b.from}–${b.to}px ${b.pct.toFixed(0)}%`).join(", ");
      lines.push(`${lines.length ? "   " : ""}pixel diff ${d.pct.toFixed(1)}%${bands ? ` (worst rows: ${bands})` : ""} → ${diffPath}`);
      if (d.transparentPct > 20) lines.push(`   reference is ${d.transparentPct.toFixed(0)}% transparent — only what Figma paints is compared`);
      if (d.zones.length)
        lines.push(`   red zones (x × y, relative to the frame): ${d.zones.map((z) => `${z.x1}–${z.x2} × ${z.y1}–${z.y2}`).join(" · ")}`);
      if (d.pct > DIFF_LIMIT) {
        lines.push(`   - pixel diff ${d.pct.toFixed(1)}% > ${DIFF_LIMIT}%: open ${diffPath} and name what each red zone is before marking the section done`);
        total++;
      }
      if (!frameX && !frameY && Math.abs(d.oursH - d.designH) > 4) { lines.push(`   - height: ours ${d.oursH} ≠ design ${d.designH}`); total++; }
    }
  } else if (width > pageWidth && Object.keys(atDesign).length) {
    const m = await measure(page, Object.keys(atDesign));
    const stretched = Object.entries(atDesign)
      .filter(([k, w]) => k !== id && m[k] && m[k].w > w * 1.05)
      .map(([k, w]) => `${k} ${w}→${m[k].w}px`);
    if (stretched.length) lines.push(`   - content stretches beyond design: ${stretched.slice(0, 4).join(", ")}`);
    total += stretched.length ? 1 : 0;
  }

  const issues = await rules(page, width);
  if (width === pageWidth) {
    const noHover = await hoverCheck(page);
    if (noHover.length) issues.push(`no hover state: ${noHover.slice(0, 4).join(" | ")}${noHover.length > 4 ? ` … +${noHover.length - 4}` : ""}`);
  }
  for (const i of issues) (ruleHits[i] ??= []).push(width);

  const head = lines.length && !lines[0].startsWith("   ") ? lines.shift() : "";
  const bad = lines.some((l) => l.startsWith("   - ")) || issues.length;
  console.log(`[${width}] ${bad ? "ISSUES" : "OK"}${head ? ` · ${head}` : ""}${issues.length ? ` · ${issues.length} rule issue(s)` : ""} → ${shot}`);
  for (const l of lines) console.log(l);
  await context.close();
}

// Same rule issue at several widths is printed once with the list of widths.
const ruleList = Object.entries(ruleHits);
if (ruleList.length) {
  console.log("Layout rules:");
  for (const [issue, ws] of ruleList) console.log(`   - [${ws.join(",")}] ${issue}`);
  total += ruleList.length;
}

await browser.close();
console.log(total ? `RESULT: ${total} issue(s)` : "RESULT: OK");
process.exit(total ? 1 : 0);
