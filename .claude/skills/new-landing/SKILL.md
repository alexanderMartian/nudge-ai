---
name: new-landing
description: Step-by-step procedure for starting a new client landing page — brief intake, scaffolding the Next.js stack on Windows, section order and build order. Use when the user starts a new landing project or runs /new-landing.
---

# New landing — procedure

Work through the phases in order. After each phase, report in 2–3 lines and wait for "ok".

## Phase 1 — Brief
Ask the user (in Ukrainian) only for what is missing:
1. Business, audience, the ONE main goal (call / form / booking / messenger).
2. Package: Basic (1 page, form → email/Telegram) · Standard (+ animations, more sections) · Premium (+ Sanity CMS).
3. Sections wanted (default below), site language(s), US or UK English.
4. Brand: logo, colors, fonts, design from Claude Design (screenshots or export).
5. Assets: photos, texts, prices, contacts, socials. Missing ones become `[PLACEHOLDER: ...]`.
6. Form destination: Resend (which email) or Telegram (bot + chat).
7. Domain, analytics (Vercel Analytics or GA4), deadline.
Then fill the header of `CLAUDE.md` (client, package, URL).

Default sections: Header/Nav → Hero (headline, subhead, CTA) → Problem/Benefits → Services → How it works → Pricing (optional) → Social proof (ONLY real material) → FAQ → Contact form → Footer.

## Phase 2 — Scaffold (PowerShell, run one by one)
```powershell
pnpm create next-app@latest <name> --ts --tailwind --eslint --app --use-pnpm --import-alias "@/*"
cd <name>
pnpm dlx shadcn@latest init
pnpm add motion lucide-react react-hook-form zod @hookform/resolvers
pnpm add resend                      # only if the form uses Resend
pnpm add @vercel/analytics           # or GA4 via @next/third-parties
pnpm add -D prettier prettier-plugin-tailwindcss playwright lighthouse
pnpm exec playwright install chromium
```
Copy the kit into the project: `CLAUDE.md`, `.claude/`, `scripts/`. Add to `package.json` scripts:
```json
"typecheck": "tsc --noEmit",
"format": "prettier --write .",
"qa:visual": "node scripts/visual-check.mjs http://localhost:3000",
"qa:lh": "node scripts/lighthouse-summary.mjs http://localhost:3000"
```
Add `.qa/` and `.env*.local` to `.gitignore`. Create `.env.example` with the needed keys (no values).
Ask before adding GSAP or Sanity — only on client request / Premium.

## Phase 3 — Build order
1. `app/layout.tsx`: fonts (next/font), theme tokens, `MotionConfig reducedMotion="user"`, base metadata.
2. `content/site.ts` with all copy (use the `client-copy` skill for English texts).
3. Sections as static Server Components, mobile-first, one file each in `components/sections/`.
4. Contact form: schema in `lib/schemas.ts` → client form (RHF + zodResolver) → `app/api/contact/route.ts` (safeParse, honeypot, Resend/Telegram).
5. Motion reveals (small client wrappers), only after the static layout is right.
6. SEO: `sitemap.ts`, `robots.ts`, OG image, favicon/icon, final metadata.
7. Analytics.
8. Checks per Definition of Done in `CLAUDE.md` → deploy to Vercel (`pnpm dlx vercel` or Git integration), set env vars in Vercel.

## Phase 4 — Handover checklist
- No `[PLACEHOLDER` left (or client agreed), form tested on production, domain + HTTPS, analytics receiving data, Lighthouse ≥ 90 mobile, client has access (Vercel / Sanity if Premium).
