#!/usr/bin/env node
// Whole-page QA in a real browser, the way a visitor uses the page (complements section-check, which compares
// sections with Figma). Prints a short report and saves full-page screenshots to .qa/screenshots.
//
// Usage: node scripts/visual-check.mjs [baseUrl] [paths...]   e.g. node scripts/visual-check.mjs http://localhost:3000 / /privacy
//        node scripts/visual-check.mjs --ping [baseUrl]
//
// Every width (360 768 1024 1440 1920): console errors, next/image warnings, page errors, failed requests / HTTP ≥ 400 (dev-server noise
// filtered), broken images, <img> without alt, number of <h1>, horizontal overflow, blocks stuck at opacity 0.
// Once per page: in-page anchor links (#id) that point nowhere, href="#" placeholders (info), mobile menu
// (360, dialog or aria-controls disclosure: open → links visible → Escape closes it and focus returns to the button →
// link closes it), keyboard walk with Tab (1440: visible focus on
// every stop, no focus on hidden elements).
// Motion (every width): first-screen elements that fade in or move on load (delays LCP — the first screen must not
// animate), animations of layout properties (width/height/top/margin… — jank and CLS), elements still invisible after
// scrolling (stuck reveal); info: infinite animations (WCAG 2.2.2), animations over 1 s, `transition: all`.
// Once per page at 1440 with prefers-reduced-motion: reduce — nothing may move (transform/translate/scale/rotate),
// nothing may stay hidden, no smooth scrolling. Detects CSS transitions/animations and the Web Animations API
// (JS libraries that write styles every frame are caught only by the first-screen check).
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const ping = args.includes("--ping");
const rest = args.filter((a) => a !== "--ping");
const base = rest[0]?.startsWith("http") ? rest.shift() : "http://localhost:3000";
// Git Bash (Windows) rewrites a "/path" argument into "C:/Program Files/Git/path" — undo that.
const unMsys = (p) => p.replace(/^[A-Za-z]:\/.*?\/Git(?=\/|$)/i, "") || "/";
const paths = rest.length ? rest.map(unMsys) : ["/"];
const WIDTHS = [360, 768, 1024, 1440, 1920];
const MENU_WIDTH = 360;
const KEYBOARD_WIDTH = 1440;
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
const hits = {}; // issue -> widths (same problem at several widths is printed once)

// Dev server traffic that is not a bug on the page. Vercel Analytics / Speed Insights load a debug script from
// va.vercel-scripts.com in development (headless Chromium blocks it); in production they use /_vercel/* on the site.
const NOISE = [/_next\/webpack-hmr/, /__nextjs/, /_next\/static\/webpack\//, /\/__webpack_hmr/, /favicon\.ico$/, /[?&]_rsc=/,
  /va\.vercel-scripts\.com\//, /\/_vercel\/(insights|speed-insights)\//];
const isNoise = (url, err = "") => NOISE.some((r) => r.test(url)) || /ERR_ABORTED/.test(err);

// ---------- motion recorder (injected before the page's own scripts) ----------
// 1) First 2.5 s after load: samples first-screen elements every 40 ms — effective opacity (own × ancestors) and
//    effective transform. Faded in = was < 0.1, ends > 0.9. Moved = the transform changed.
// 2) Whole lifetime: every running animation (document.getAnimations(): CSS transitions, CSS animations, WAAPI) with
//    its properties and the phase it started in (load / scroll / interact — set from Node).
const MOTION_RECORDER = () => {
  if (window !== window.top) return;
  const M = (window.__motion = { phase: "load", log: [], first: [], done: false });
  const label = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += `#${el.id}`;
    const aria = el.getAttribute?.("aria-label");
    if (aria) s += `[${aria}]`;
    const text = (el.innerText || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 28);
    return text ? `${s} "${text}"` : s;
  };
  const kebab = (p) => p.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  const seen = new WeakSet();
  const pollAnimations = () => {
    for (const a of document.getAnimations()) {
      if (seen.has(a)) continue;
      seen.add(a);
      const target = a.effect?.target;
      if (!target || !(target instanceof Element)) continue;
      let props = [];
      if (a.transitionProperty) props = [a.transitionProperty];
      else {
        try {
          props = [...new Set(a.effect.getKeyframes().flatMap((k) => Object.keys(k)))]
            .filter((k) => !["offset", "computedOffset", "easing", "composite"].includes(k)).map(kebab);
        } catch { /* ignore */ }
      }
      const t = a.effect.getComputedTiming?.() || {};
      const scrollLinked = !!a.timeline && !(a.timeline instanceof DocumentTimeline);
      M.log.push({
        target, label: label(target), props, phase: M.phase, scrollLinked,
        infinite: t.iterations === Infinity, duration: typeof t.duration === "number" ? t.duration : 0,
        interactive: !!target.closest("[data-state]"),
      });
    }
  };
  setInterval(pollAnimations, 30);

  // ---- first screen ----
  const SEL = "h1,h2,h3,h4,p,img,picture,video,svg,a,button,li,blockquote,[data-reveal],[style*=opacity],[style*=transform]";
  const track = new Map(); // el -> { min, sigs:Set, last }
  const norm = (s) => {
    const parts = [];
    if (s.transform !== "none" && s.transform !== "matrix(1, 0, 0, 1, 0, 0)") parts.push(s.transform);
    if (s.translate !== "none" && !/^0px( 0px)?( 0px)?$/.test(s.translate)) parts.push(`t:${s.translate}`);
    if (s.scale !== "none" && s.scale !== "1") parts.push(`s:${s.scale}`);
    if (s.rotate !== "none" && s.rotate !== "0deg") parts.push(`r:${s.rotate}`);
    return parts.join(" ");
  };
  const sample = () => {
    if (!document.body) return;
    const memoO = new Map(), memoT = new Map();
    const effO = (el) => {
      if (!el || el === document.documentElement) return 1;
      if (memoO.has(el)) return memoO.get(el);
      const v = Number(getComputedStyle(el).opacity) * effO(el.parentElement);
      memoO.set(el, v);
      return v;
    };
    const effT = (el) => {
      if (!el || el === document.documentElement) return "";
      if (memoT.has(el)) return memoT.get(el);
      const v = `${effT(el.parentElement)}|${norm(getComputedStyle(el))}`;
      memoT.set(el, v);
      return v;
    };
    const vh = window.innerHeight;
    for (const el of document.body.querySelectorAll(SEL)) {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || r.bottom <= 0 || r.top >= vh) continue;
      const o = effO(el), sig = effT(el);
      const t = track.get(el) || { min: 1, sigs: new Set() };
      t.min = Math.min(t.min, o);
      t.sigs.add(sig);
      t.last = { o, sig };
      track.set(el, t);
    }
  };
  const timer = setInterval(sample, 40);
  const finish = () => {
    clearInterval(timer);
    sample();
    pollAnimations();
    const vh = window.innerHeight;
    const loops = (el) => M.log.some((x) => x.infinite && (x.target === el || x.target.contains(el)));
    const faded = [], moved = [];
    for (const [el, t] of track) {
      const r = el.getBoundingClientRect();
      if (!el.isConnected || r.bottom <= 0 || r.top >= vh || loops(el)) continue;
      if (t.min < 0.1 && t.last.o > 0.9) faded.push(el);
      else if (t.sigs.size > 1) moved.push(el);
    }
    // Report the outermost element of each animated group.
    const outer = (list) => list.filter((el) => !list.some((o) => o !== el && o.contains(el)));
    M.first = [
      ...outer(faded).map((el) => `fades in: ${label(el)}`),
      ...outer(moved).map((el) => `moves: ${label(el)}`),
    ];
    M.done = true;
  };
  const start = () => setTimeout(finish, 2500);
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
};

const LAYOUT_PROP = /^(width|height|min-width|min-height|max-width|max-height|top|left|right|bottom|inset|margin|padding|font-size|line-height|letter-spacing|border(-[a-z]+)*-width|grid-template|gap|row-gap|column-gap)/;
const MOVE_PROP = /^(transform|translate|scale|rotate|offset-)/;

// Reads the motion log in Node-friendly form (phases load + scroll only, i.e. without user interaction).
async function motionReport(page) {
  return page.evaluate(({ layout, move }) => {
    const L = new RegExp(layout), MV = new RegExp(move);
    const M = window.__motion || { log: [], first: [] };
    const passive = M.log.filter((x) => x.phase !== "interact");
    const shown = (el) => { const r = el.getBoundingClientRect(); return el.isConnected && r.width > 0 && r.height > 0; };
    const uniq = (arr) => [...new Set(arr)];
    return {
      first: M.first,
      layout: uniq(passive.filter((x) => !x.interactive && x.props.some((p) => L.test(p)))
        .map((x) => `${x.label} (${x.props.filter((p) => L.test(p)).join(", ")})`)),
      moving: uniq(passive.filter((x) => x.props.some((p) => MV.test(p) || p === "all")).map((x) => `${x.label} (${x.props.join(", ")})`)),
      infinite: uniq(passive.filter((x) => x.infinite && shown(x.target)).map((x) => x.label)),
      slow: uniq(passive.filter((x) => !x.infinite && !x.scrollLinked && x.duration > 1000).map((x) => `${x.label} ${Math.round(x.duration)} ms`)),
    };
  }, { layout: LAYOUT_PROP.source, move: MOVE_PROP.source });
}

const setPhase = (page, phase) => page.evaluate((p) => { if (window.__motion) window.__motion.phase = p; }, phase);
const motionDone = (page) => page.waitForFunction(() => window.__motion?.done, null, { timeout: 10000 }).catch(() => {});

// Scroll through the page so lazy images, reveal-on-scroll and whileInView animations run, then wait for the last
// (staggered) reveal to finish.
async function scrollThrough(page) {
  // A real visitor's scroll is user input, which ends LCP measurement. Our programmatic scroll is not, so images far
  // below the fold become "LCP" and next/image warns about them — ignore LCP warnings from here on (see openPage).
  page.__scrolled = true;
  await page.evaluate(async () => {
    const step = Math.max(400, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForTimeout(1200);
}

const HIDDEN_BLOCKS = () => {
  const effO = (el) => (!el || el === document.documentElement ? 1 : Number(getComputedStyle(el).opacity) * effO(el.parentElement));
  return [...document.querySelectorAll("section, section > *, [data-reveal]")]
    .filter((el) => el.getBoundingClientRect().height > 40 && effO(el) < 0.05)
    .filter((el, _, all) => !all.some((o) => o !== el && o.contains(el)))
    .slice(0, 3).map(window.__label);
};

async function openPage(width, path, problems, contextOptions = {}) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, ...contextOptions });
  await page.addInitScript(MOTION_RECORDER);
  if (problems) {
    const imageWarnings = new Set();
    page.on("console", (m) => {
      const t = m.text();
      // Framework warnings that are real bugs (dev server only): next/image misuse (fill without a positioned
      // parent, missing sizes, LCP image without loading="eager"…). The same warning for several images is reported
      // once, with the first image's file name.
      if (m.type() === "warning" && /^Image with src /.test(t)) {
        if (page.__scrolled && /Largest Contentful Paint/i.test(t)) return; // artefact of our scroll, not a real LCP
        const kind = t.replace(/^Image with src "[^"]*"/, "");
        if (imageWarnings.has(kind)) return;
        imageWarnings.add(kind);
        const file = (t.match(/^Image with src "([^"]*)"/)?.[1] || "").split("/").pop();
        problems.push(`next/image warning (${file}): Image${kind.slice(0, 140)}`);
        return;
      }
      if (m.type() !== "error") return;
      if (/Download the React DevTools|\[HMR\]|\[Fast Refresh\]/.test(t)) return;
      if (/Failed to load resource/.test(t) && isNoise(m.location()?.url || "")) return; // same noise as requests
      problems.push(`console: ${t.slice(0, 160)}`);
    });
    page.on("pageerror", (e) => problems.push(`page error: ${String(e.message).slice(0, 160)}`));
    page.on("requestfailed", (r) => !isNoise(r.url(), r.failure()?.errorText) && problems.push(`request failed: ${r.url().slice(0, 120)} (${r.failure()?.errorText || ""})`));
    page.on("response", (r) => r.status() >= 400 && !isNoise(r.url()) && problems.push(`HTTP ${r.status()}: ${r.url().slice(0, 120)}`));
  }
  await page.goto(new URL(path, base).toString(), { waitUntil: "networkidle", timeout: 45000 });
  await page.addStyleTag({ content: "nextjs-portal, [data-nextjs-toast], [data-next-badge-root] { display: none !important; }" });
  return page;
}

const LABEL = () => {
  window.__label = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += `#${el.id}`;
    const aria = el.getAttribute?.("aria-label");
    if (aria) s += `[${aria}]`;
    const text = (el.innerText || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 28);
    return text ? `${s} "${text}"` : s;
  };
  window.__shown = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0.05;
  };
};

// ---------- mobile menu ----------
// The menu can be a dialog (role=dialog / aria-modal — shadcn Sheet, Radix) or a disclosure: the button has
// aria-expanded + aria-controls="<id>" and shows that element (W3C APG disclosure pattern — a plain list of anchors).
// The panel is found by the button's aria-controls first, then by dialog markup.
const MENU_HELPERS = () => {
  window.__menuPanel = () => {
    const btn = document.querySelector("[data-qa-menu]");
    const linksIn = (d) => [...d.querySelectorAll("a[href]")].filter(window.__shown).length;
    const byLinks = (x, y) => linksIn(y) - linksIn(x);
    const ids = (btn?.getAttribute("aria-controls") || "").split(/\s+/).filter(Boolean);
    const controlled = ids.map((id) => document.getElementById(id)).filter((d) => d && window.__shown(d));
    if (controlled.length) return controlled.sort(byLinks)[0];
    // Prefer the dialog itself over overlays (Radix renders an overlay with data-state=open before the content).
    const dialogs = [...document.querySelectorAll("[role=dialog], [aria-modal=true]")].filter(window.__shown);
    const fallback = [...document.querySelectorAll("[data-state=open]")].filter((d) => window.__shown(d) && d !== btn);
    return (dialogs.length ? dialogs : fallback).sort(byLinks)[0] || null;
  };
  // Is the panel found when the menu was opened still visible? Checked by its marker, so an unrelated dialog
  // (cookie banner) doesn't count; a panel removed from the DOM on close counts as closed.
  window.__menuOpen = () => {
    const panel = document.querySelector("[data-qa-menu-panel]");
    return !!panel && window.__shown(panel);
  };
};

async function checkMenu(page) {
  await page.evaluate(LABEL);
  await page.evaluate(MENU_HELPERS);
  const found = await page.evaluate(() => {
    const header = document.querySelector("header") || document.body;
    const btn = [...header.querySelectorAll("button, [role=button]")].find(
      (b) => window.__shown(b) && (b.hasAttribute("aria-expanded") || b.hasAttribute("aria-haspopup") || /menu|навіг|меню|nav/i.test(b.getAttribute("aria-label") || b.textContent || ""))
    );
    const visibleLinks = [...header.querySelectorAll("nav a[href]")].filter(window.__shown).length;
    if (btn) btn.setAttribute("data-qa-menu", "1");
    return { button: !!btn, label: btn ? window.__label(btn) : "", visibleLinks };
  });
  if (!found.button) return found.visibleLinks ? [] : ["mobile menu: no menu button and no visible nav links in <header> at 360"];
  const issues = [];
  const btn = page.locator("[data-qa-menu]");
  const open = async () => {
    await btn.click({ timeout: 3000 });
    await page.waitForTimeout(900); // open animation
    return page.evaluate(() => {
      document.querySelector("[data-qa-menu-panel]")?.removeAttribute("data-qa-menu-panel");
      const panel = window.__menuPanel();
      if (!panel) return null;
      panel.setAttribute("data-qa-menu-panel", "1");
      const links = [...panel.querySelectorAll("a[href]")].filter(window.__shown);
      document.querySelector("[data-qa-menu-link]")?.removeAttribute("data-qa-menu-link");
      if (links[0]) links[0].setAttribute("data-qa-menu-link", "1");
      return { links: links.length, expanded: document.querySelector("[data-qa-menu]").getAttribute("aria-expanded") };
    });
  };

  const opened = await open();
  if (!opened) return [`mobile menu: ${found.label} doesn't open a visible menu (no visible aria-controls target, role=dialog or data-state=open)`];
  if (!opened.links) issues.push("mobile menu: opened, but has no visible links");
  if (opened.expanded === "false") issues.push("mobile menu: aria-expanded stays false when open");

  // Escape with focus inside the menu: the menu closes and focus goes back to the button (not lost to <body>).
  await page.evaluate(() => document.querySelector("[data-qa-menu-link]")?.focus());
  await page.keyboard.press("Escape");
  await page.waitForTimeout(700);
  const esc = await page.evaluate(() => {
    const b = document.querySelector("[data-qa-menu]");
    const a = document.activeElement;
    return {
      stillOpen: window.__menuOpen(),
      focusLost: !a || a === document.body || a === document.documentElement,
      focusOnButton: !!a && b.contains(a),
      expanded: b.getAttribute("aria-expanded"),
    };
  });
  if (esc.stillOpen) {
    issues.push("mobile menu: Escape doesn't close it");
    return issues; // can't reopen reliably — skip the link test
  }
  if (opened.links && !esc.focusOnButton) {
    issues.push(`mobile menu: after Escape focus ${esc.focusLost ? "is lost (on <body>)" : "doesn't return to the menu button"} — move it back to the button`);
  }
  if (esc.expanded === "true") issues.push("mobile menu: aria-expanded stays true after closing");

  if (opened.links) {
    const again = await open();
    const link = page.locator("[data-qa-menu-link]");
    if (again && (await link.count())) {
      await link.first().click({ timeout: 3000 });
      await page.waitForTimeout(600);
      if (await page.evaluate(() => window.__menuOpen())) issues.push("mobile menu: stays open after clicking a link (anchor links should close it)");
    }
  }
  return issues;
}

// ---------- keyboard walk ----------
async function checkKeyboard(page) {
  await page.evaluate(LABEL);
  await page.evaluate(() => {
    const look = (el) => {
      const chain = [el, el.parentElement, el.parentElement?.parentElement].filter(Boolean);
      return chain.map((e) => { const s = getComputedStyle(e); return [s.outlineStyle, s.outlineWidth, s.outlineColor, s.boxShadow, s.borderColor, s.backgroundColor, s.textDecorationLine].join("|"); }).join("#");
    };
    window.__look = look;
    window.__base = new Map();
    window.__tabN = 0;
    for (const el of document.querySelectorAll("a[href], button, input, select, textarea, [tabindex]")) window.__base.set(el, look(el));
  });
  const noFocus = [], hidden = [], seen = new Set();
  let stops = 0;
  for (let i = 0; i < 150; i++) {
    await page.keyboard.press("Tab");
    const r = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const key = el.dataset.qaTab || (el.dataset.qaTab = String(++window.__tabN)); // identity, not text — 4 "Order Now" in a row are 4 stops
      return { key, label: window.__label(el), shown: window.__shown(el), changed: window.__look(el) !== window.__base.get(el) };
    });
    if (!r) break;
    if (seen.has(r.key)) break; // wrapped around or trapped
    seen.add(r.key);
    stops++;
    if (!r.shown) hidden.push(r.label);
    else if (!r.changed) noFocus.push(r.label);
  }
  const issues = [];
  if (noFocus.length) issues.push(`keyboard: no visible focus on ${noFocus.length}/${stops} stops: ${noFocus.slice(0, 4).join(" | ")}`);
  if (hidden.length) issues.push(`keyboard: focus lands on hidden elements: ${hidden.slice(0, 3).join(" | ")}`);
  return { stops, issues };
}

for (const path of paths) {
  const slug = path === "/" ? "home" : path.replace(/^\/+|\/+$/g, "").replace(/[^\w-]+/g, "-");
  let anchorsDone = false;
  for (const width of WIDTHS) {
    const problems = [];
    const info = [];
    let page;
    try {
      page = await openPage(width, path, problems);
    } catch (e) {
      console.log(`[${width}] ${path}: cannot load (${e.message.split("\n")[0]})`);
      total++;
      continue;
    }

    await motionDone(page); // first-screen sampling (2.5 s after load)
    await setPhase(page, "scroll");
    await scrollThrough(page);
    await page.evaluate(LABEL);
    const hiddenBlocks = await page.evaluate(HIDDEN_BLOCKS);
    const mo = await motionReport(page);
    await setPhase(page, "interact");

    const r = await page.evaluate(async () => {
      const vw = document.documentElement.clientWidth;
      const overflowX = document.documentElement.scrollWidth > vw + 1;
      const offenders = [];
      if (overflowX) {
        for (const el of document.querySelectorAll("body *")) {
          const b = el.getBoundingClientRect();
          if (b.width > 0 && b.height > 0 && (b.right > vw + 1 || b.left < -1)) {
            if (offenders.some((o) => o.contains(el))) continue;
            offenders.push(el);
            if (offenders.length >= 5) break;
          }
        }
      }
      const imgs = [...document.images];
      const broken = imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => (i.currentSrc || i.src).slice(0, 100));
      const noAlt = imgs.filter((i) => !i.hasAttribute("alt")).length;
      // Responsive images (srcset, i.e. next/image) that download a file much wider than they are shown → `sizes`
      // claims a bigger slot than the layout gives. object-cover is respected: a tall box needs a wider file.
      const fileOf = (src) => {
        try {
          const u = new URL(src, location.href);
          return decodeURIComponent(u.searchParams.get("url") || u.pathname).split("/").slice(-2).join("/");
        } catch { return src.slice(0, 60); }
      };
      // With srcset, naturalWidth is density-corrected (≈ the slot `sizes` promised), and the `w` descriptor can be
      // larger than the file (next/image never upscales the original), so the real width is read from the file itself.
      const fileWidth = (i) => new Promise((done) => {
        const probe = new Image();
        probe.onload = () => done(probe.naturalWidth);
        probe.onerror = () => done(i.naturalWidth);
        probe.src = i.currentSrc;
      });
      const oversized = [];
      for (const i of imgs) {
        if (!i.srcset || !i.complete || !i.naturalWidth || !i.currentSrc) continue;
        const r = i.getBoundingClientRect();
        if (r.width < 64 || r.height < 64) continue;
        const fileW = await fileWidth(i);
        const cover = getComputedStyle(i).objectFit === "cover";
        const needed = Math.max(r.width, cover ? (r.height * i.naturalWidth) / i.naturalHeight : 0) * (window.devicePixelRatio || 1);
        if (fileW > needed * 1.5 && fileW - needed > 100) {
          oversized.push(`${fileOf(i.currentSrc)} loads ${fileW}w, shown ${Math.round(r.width)}px`);
        }
      }
      const h1 = document.querySelectorAll("h1").length;
      const transitionAll = [...document.querySelectorAll("body *")].filter((el) => {
        const s = getComputedStyle(el);
        return s.transitionProperty.split(",").some((p) => p.trim() === "all") && s.transitionDuration.split(",").some((d) => parseFloat(d) > 0);
      });
      const anchors = [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute("href"));
      const deadAnchors = [...new Set(anchors.filter((h) => h.length > 1 && !document.getElementById(decodeURIComponent(h.slice(1)))))];
      const placeholders = anchors.filter((h) => h === "#").length;
      return {
        overflowX, offenders: offenders.map(window.__label), broken, noAlt, h1, deadAnchors, placeholders,
        oversized: [...new Set(oversized)],
        transitionAll: { count: transitionAll.length, some: transitionAll.slice(0, 3).map(window.__label) },
      };
    });

    if (r.overflowX) problems.push(`horizontal overflow; wider than viewport: ${r.offenders.join(" | ") || "unknown element"}`);
    if (r.broken.length) problems.push(`broken images: ${r.broken.join(", ")}`);
    if (r.noAlt) problems.push(`${r.noAlt} <img> without alt attribute`);
    if (r.oversized.length) problems.push(`images much wider than shown (fix \`sizes\` to the real slot width): ${r.oversized.slice(0, 3).join(" | ")}${r.oversized.length > 3 ? ` … +${r.oversized.length - 3}` : ""}`);
    if (r.h1 !== 1) problems.push(`${r.h1} <h1> elements (expected 1)`);
    if (hiddenBlocks.length) problems.push(`invisible after scroll (opacity 0, stuck reveal?): ${hiddenBlocks.join(" | ")}`);
    // Motion
    if (mo.first.length) problems.push(`motion: first screen animates on load (delays LCP — never animate the first screen): ${mo.first.slice(0, 3).join(" | ")}${mo.first.length > 3 ? ` … +${mo.first.length - 3}` : ""}`);
    if (mo.layout.length) problems.push(`motion: animates layout properties (use transform/opacity): ${mo.layout.slice(0, 3).join(" | ")}`);
    if (!anchorsDone) {
      if (r.deadAnchors.length) problems.push(`anchor links to missing ids: ${r.deadAnchors.join(", ")}`);
      if (r.placeholders) info.push(`${r.placeholders} link(s) with href="#" (placeholders — real URLs before launch)`);
      if (r.transitionAll.count) info.push(`motion: ${r.transitionAll.count} element(s) with transition: all — name the properties: ${r.transitionAll.some.join(" | ")}`);
      if (mo.infinite.length) info.push(`motion: infinite animation (WCAG 2.2.2 — longer than 5 s needs a pause control): ${mo.infinite.slice(0, 3).join(" | ")}`);
      if (mo.slow.length) info.push(`motion: animation longer than 1 s (feels slow): ${mo.slow.slice(0, 3).join(" | ")}`);
      anchorsDone = true;
    }

    const file = join(OUT, `${slug}-${width}.png`);
    await page.screenshot({ path: file, fullPage: true });

    if (width === MENU_WIDTH) {
      try { problems.push(...(await checkMenu(page))); } catch (e) { problems.push(`mobile menu: check failed (${e.message.split("\n")[0]})`); }
    }
    if (width === KEYBOARD_WIDTH) {
      try {
        const k = await checkKeyboard(page);
        problems.push(...k.issues);
        info.push(`keyboard: ${k.stops} Tab stops`);
      } catch (e) { problems.push(`keyboard: check failed (${e.message.split("\n")[0]})`); }
    }
    await page.close();

    const unique = [...new Set(problems)];
    for (const u of unique) (hits[`${path} ${u}`] ??= []).push(width);
    console.log(`[${width}] ${path}: ${unique.length ? `${unique.length} issue(s)` : "OK"} → ${file}`);
    for (const i of info) console.log(`   · ${i}`);
  }

  // ---------- prefers-reduced-motion: reduce ----------
  const problems = [];
  try {
    const page = await openPage(KEYBOARD_WIDTH, path, null, { reducedMotion: "reduce" });
    await motionDone(page);
    await setPhase(page, "scroll");
    await scrollThrough(page);
    await page.evaluate(LABEL);
    const hidden = await page.evaluate(HIDDEN_BLOCKS);
    const mo = await motionReport(page);
    // Smooth scrolling anywhere: the page (<html>) and scroll containers such as carousels (`scroll-smooth` class).
    const smooth = await page.evaluate(() =>
      [document.documentElement, ...document.querySelectorAll("body *")]
        .filter((el) => getComputedStyle(el).scrollBehavior === "smooth")
        .slice(0, 3)
        .map((el) => (el === document.documentElement ? "<html>" : window.__label(el))));
    await page.close();
    if (mo.moving.length) problems.push(`reduced motion: still moves (wrap in motion-safe: / @media (prefers-reduced-motion: no-preference)): ${mo.moving.slice(0, 3).join(" | ")}`);
    if (hidden.length) problems.push(`reduced motion: invisible after scroll: ${hidden.join(" | ")}`);
    if (smooth.length) problems.push(`reduced motion: smooth scrolling is still on (use motion-safe:scroll-smooth; JS scrollTo/scrollBy → behavior "auto" when reduced): ${smooth.join(" | ")}`);
  } catch (e) {
    problems.push(`reduced motion: check failed (${e.message.split("\n")[0]})`);
  }
  for (const u of problems) (hits[`${path} ${u}`] ??= []).push(`${KEYBOARD_WIDTH} reduced`);
  console.log(`[${KEYBOARD_WIDTH} reduced motion] ${path}: ${problems.length ? `${problems.length} issue(s)` : "OK"}`);
}

await browser.close();
const list = Object.entries(hits);
if (list.length) {
  console.log("Issues:");
  for (const [issue, ws] of list.slice(0, 20)) console.log(`   - [${ws.join(",")}] ${issue}`);
  if (list.length > 20) console.log(`   … and ${list.length - 20} more`);
}
total += list.length;
console.log(total ? `RESULT: ${total} issue(s)` : "RESULT: OK");
process.exit(total ? 1 : 0);
