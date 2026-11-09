---
name: client-copy
description: Writes or rewrites the English copy of a landing — replaces design lorem, headlines, CTAs, menu/product items, testimonials for concept sites, form microcopy and alt texts — within the layout's length limits, in real-client or portfolio mode, with a review table before anything is written to content/site.ts and a short Ukrainian explanation. Use when the user runs /client-copy or asks to write, rewrite, extend or check site texts.
---

# /client-copy — procedure

Copy lives only in `content/site.ts`. Components are not edited here — if a text needs a component change (a new
label, an accessible name), list it for a separate task. Reply to the user in Ukrainian; the site copy is English.

## Step 0 — context and mode
- Read `CLAUDE.md` (Business, Package, site language, Live URL), the whole `content/site.ts`, the metadata in
  `app/layout.tsx` (title/description from `/seo-setup`) and, if present, `design/*.spec.json` → `texts`
  (the design copy — the length reference).
- Decide the **mode** and say it in one line:
  - **Real client** — only facts from the client or the brief. Missing fact → keep the field, put a
    `// PLACEHOLDER: what to ask the client` comment above it and add the question to the report.
  - **Portfolio / concept** (`Package: portfolio`, or the user says so) — invented brand copy, product names,
    descriptions and prices are fine: the business itself is fictional. Social proof must still not pose as real:
    testimonials get a visible label (e.g. "Sample reviews") and the footer a note ("Concept project — not a real
    café"). Never invent stats, awards, press logos or "trusted by" claims.
- Brief: audience, the ONE main goal/CTA, tone (friendly / premium / formal), US or UK spelling, currency and price
  format. Unknown → ask once, in one message. Never invent the real client's facts.

## Step 1 — inventory with length budgets
List every field you will write, grouped by section: current text, and its **budget**:
- Default budget = design text length ±20 %. Headlines: the same number of lines as the design at 1920 and no more
  than one extra line at 360. Buttons: ≤ the design length + 4 characters.
- Repeated items (menu cards, testimonials, features): current count → requested count. Extra items follow the shape
  of the existing ones (same fields, same budgets); images may repeat if the user says so.

## Step 2 — write
- Plain, specific, benefit-first: what the visitor gets, for whom, what to do next. Active voice, "you".
- Headline ≤ 10 words. Subheadline one sentence ≤ 25 words. Paragraphs ≤ 3 short sentences.
- CTA = verb + outcome ("Order your coffee", "Get 15% off") — not "Submit", "Learn more", "Click here".
  One main CTA repeated (hero, middle, end); secondary CTAs weaker.
- SEO: the H1 says what + for whom (+ city/area for a local business). Section headings are descriptive, not only
  clever. If the hero changes, propose a matching `title`/`description` for `/seo-setup` — don't edit metadata here.
- Menu / product items: realistic names; one-sentence description within budget (taste, ingredients, size);
  consistent price format (`$4.50`); no superlatives in every item.
- Testimonials (concept mode): varied voices and lengths within budget, concrete details (a drink, a moment),
  first name + last initial, no photos of real people (keep the placeholder avatar or use initials).
- Microcopy for every form: label, placeholder, helper/consent line ("No spam. Unsubscribe anytime."), success,
  validation error, server error, loading state ("Subscribing…").
- Accessibility: link and button texts say what happens; `alt` describes the image in context (decorative → `""`);
  repeated buttons ("Add to cart" × 16) need distinct accessible names ("Add Lungo to cart") → list as a component
  change.
- Avoid AI clichés: unlock, elevate, seamless, cutting-edge, revolutionize, game-changer, empower, delve, "in today's
  fast-paced world", "look no further", "take your X to the next level", em-dash overuse, triple adjectives.
- Consistent spelling, terminology and capitalisation across the page (one name for one thing).

## Step 3 — review table, then STOP
Per section, one table: `field | was | new | chars / budget`. For headlines and CTAs give 3 variants and mark the
recommended one. Below the tables: component changes needed (labels, accessible names) and PLACEHOLDER questions.
Wait for "ok" or edits. Nothing is written before that.

## Step 4 — write to `content/site.ts`
- Keep the existing shape and types; append new items to arrays.
- Remove `// PLACEHOLDER: lorem …` comments that are now resolved; keep the ones that still need real facts.
- Placeholder text never goes into rendered strings or `alt` — only `// PLACEHOLDER:` comments above the field.

## Step 5 — verify
- `pnpm lint`, `pnpm typecheck`.
- With the dev server running (the user starts it): `node scripts/section-check.mjs --page` and
  `node scripts/visual-check.mjs`. Text-map mismatches and a higher pixel diff in text areas are **expected now** —
  the copy differs from the design on purpose. Judge only layout: no overflow, no extra lines beyond the budget at 360
  and 1920, sections keep their positions.
- Report in Ukrainian: what each block now says and why, what was left as PLACEHOLDER (questions for the client),
  and the component changes for the next task. Don't commit.
