---
name: animate
description: Adds a fast, accessible animation layer to a finished Next.js + Tailwind v4 landing — motion tokens, reveal-on-scroll for sections and card lists (one tiny observer, sections stay Server Components, first screen never animated), smooth anchor scrolling, hover/press feedback, prefers-reduced-motion everywhere. CSS first; the Motion library only for cases CSS can't do. Use when the user runs /animate or asks to add animations, scroll effects or hover effects to a landing page.
---

# /animate — procedure

Goal: the page feels alive, but Lighthouse, CLS and accessibility stay exactly as good as before.
Code patterns live in `references/recipes.md` — read it first and copy from it. Reply to the user in Ukrainian.

## Rules (all steps)
1. **Never animate the first screen on load** — Header, Hero and anything visible at 360×800 or 1440×900 without
   scrolling. Chrome ignores `opacity: 0` paints for LCP, so a hero fade-in delays LCP; the page also looks slower.
2. **Only `opacity`, `translate`, `scale`, `rotate` (transform)**, plus colours on hover. Never `width`, `height`,
   `top/left`, `margin`, `padding`, `font-size`, `box-shadow` on large areas. Never `transition-all`.
3. **Content is visible without JavaScript.** Hidden-before-reveal state is set by JS, only for elements below the
   viewport. No `opacity-0` classes in the markup.
4. **`prefers-reduced-motion: reduce`** → no movement (translate/scale/parallax/smooth scroll); content fully visible.
   Colour and opacity changes may stay.
5. **CSS first.** The Motion library only for: exit animations of elements leaving the DOM, layout animations,
   drag, springs, sequences. Never for reveal-on-scroll or hover. Adding or removing a package → ask the user first.
6. Sections stay Server Components — the reveal works through the server `<Reveal>` wrapper (`data-reveal` +
   `suppressHydrationWarning`), never a raw `data-reveal` attribute and never `"use client"`.
7. Durations and easing come from the tokens: hover 150 ms, UI 250 ms, reveal 500 ms, stagger 70 ms (max 6 items),
   `ease-enter` for appearing, `ease-standard` for state changes. Nothing loops forever on a business landing
   (WCAG 2.2.2: an auto-playing animation longer than 5 s needs a pause button).
8. Focus styles stay as they are (`focus-visible`), hover styles don't replace them.
9. Edit files with Edit/Write only (no shell one-liners), and keep the design: animation never changes the final look.

## Step 0 — before starting
- Read `CLAUDE.md` (Project status, Conventions), `references/recipes.md`, and the Next.js docs bundled in
  `node_modules/next/dist/docs/` about `data-scroll-behavior` / smooth scrolling (grep for `scroll-behavior`).
- `package.json`: is `motion` (or `framer-motion`) installed? Is it imported anywhere? (grep `motion/react`,
  `framer-motion`). Unused → mention it, don't remove it.
- Grep what already moves: `transition-all`, `transition`, `animate-`, `@keyframes`, `duration-`, `hover:`,
  `scroll-smooth`, `opacity-0`. List problems against the rules above (e.g. `transition-all`, an `opacity-0` hero).
- Ask the user for the current Lighthouse numbers (CLAUDE.md status line) — they are the "before".

## Step 1 — inventory
Sections in page order (`app/page.tsx`, `design/page.json`). For each one decide:
- **First screen?** Header + Hero at least; use `design/page.json` heights — anything starting above ~800 px on
  mobile or ~900 px on desktop is first screen → no reveal.
- **What's in it:** heading block, card list/grid (how many), carousel row, image, form, testimonials.
- **Interactive elements:** buttons, links, cards that are links, images inside cards.

## Step 2 — propose the package and wait for "ok"
One table, then stop and wait:

| Section | Element | Effect | Implementation |
|---|---|---|---|
| (all) | tokens, smooth anchor scroll | — | `globals.css`, `<html>` |
| Coffee menu | heading block | reveal | `<Reveal as="h2">` |
| Coffee menu | cards row | reveal once (carousel) | `<Reveal>` around the row |
| Features | 4 cards | reveal + stagger | `<Reveal as="li" index={i}>` |
| (cards) | product card | lift on hover, image zoom | Tailwind classes |
| … | | | |

The **standard package** (default — propose it unless the design asks for more):
1. Motion tokens in `globals.css`.
2. Reveal on scroll: heading block of every section below the first screen; card grids with stagger (≤ 6);
   carousel rows revealed once as a whole; large images in content sections (never images with `mix-blend-*` —
   recipes section 7). Footer usually not: the end of the page, nobody notices.
3. Smooth scrolling to anchors (`motion-safe:scroll-smooth`), `scroll-mt-*` if the header is sticky/fixed.
4. Hover/press: buttons and links — colour transition (an existing `transition-colors` already is 150 ms +
   the standard curve = our tokens — leave it, don't rewrite classes for nothing); clickable cards only — lift +
   shadow layer; card images — zoom inside an `overflow-hidden` frame. Touch screens are already excluded by Tailwind v4 (`@media (hover: hover)`).
5. Reduced motion handled by the CSS and the observer — nothing else to add.

Anything outside the package (parallax, scroll progress bar, counters, marquee, page transitions, Motion) → list it
as an option with its cost (KB, Lighthouse risk, browser support) and let the user choose.

## Step 3 — base (once)
From `references/recipes.md`:
1. Tokens (section 1) and reveal CSS (section 2) in `app/globals.css`. Unlayered CSS beats Tailwind utilities, so the
   reveal rules only set state on `[data-reveal="pending"]`; don't put `data-reveal` on an element that has its own
   `opacity-*`, `translate-*` or `transition-*` classes — wrap it.
2. `components/RevealObserver.tsx`, mounted once at the end of `<body>` in `app/layout.tsx`, and
   `components/Reveal.tsx` (the wrapper sections use).
3. `<html className="motion-safe:scroll-smooth" data-scroll-behavior="smooth">` (merge with existing classes).
4. Replace every `transition-all` found in Step 0 with the named properties.

## Step 4 — apply per section
- Wrap exactly what was approved in Step 2 with `<Reveal>`; stagger with `index={i}`.
- Hover classes with tokens: `duration-(--motion-fast) ease-standard`; cards `motion-safe:hover:-translate-y-1`.
- Don't touch sizes, spacing, colours, fonts or structure — the static look must stay pixel-identical
  (`section-check` runs with reduced motion, so it compares the final state).
- Motion library (only if approved): `MotionProvider` around the smallest subtree that needs it, `m` components,
  `MotionConfig reducedMotion="user"` (recipes section 6).

## Step 5 — verify
1. `pnpm lint` and `pnpm typecheck`.
2. Dev server running (the user starts it — never start servers yourself):
   - `node scripts/visual-check.mjs` → the animation lines must be OK: nothing on the first screen fades in or moves
     on load, no layout properties animated, nothing stuck invisible after scrolling, reduced-motion run clean.
     `transition-all` / infinite animations are reported as info — fix or justify.
   - `node scripts/section-check.mjs --page` → same result as before (it uses reduced motion = final state).
3. Production: ask the user to restart `pnpm prod` (port 3001), then
   `node scripts/lighthouse-summary.mjs --runs 3`. Compare with "before": CLS must stay ≤ 0.01, Performance within
   the noise (−2 points at most), LCP not later. If it looks worse, don't guess — A/B on the same machine: `git stash -u`
   → user restarts `pnpm prod` → `--runs 5`; `git stash pop` → restart → `--runs 5`; the user keeps the computer idle
   and stops `pnpm dev` during runs (Coffea: 83 looked like a regression, A/B showed 87 vs 87 — machine load).
   The checks (`visual-check`, `section-check --base http://localhost:3001`) can run on the same production server.
4. Ask the user to check by eye: scroll the page at 360 and 1440; then turn on reduced motion (Windows: Settings →
   Accessibility → Visual effects → Animation effects off, or DevTools → Rendering → Emulate CSS
   prefers-reduced-motion) and reload — nothing moves, everything is visible, anchors jump instantly.

## Step 6 — finish
- Add to `CLAUDE.md` → Conventions: `Animations: /animate standard package — tokens in globals.css,
  <Reveal> + RevealObserver, hover via tokens; first screen never animated.`
- Report in Ukrainian: which files changed and what each change does (how the reveal works in one paragraph), the
  Lighthouse before → after, what was left out and why. Don't commit.
