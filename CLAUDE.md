# Project: <CLIENT NAME> landing

<One line: what the business is, who the audience is, the main CTA.>
Package: <Basic | Standard | Premium>. Live URL: <https://...>

## Stack
Next.js (App Router) + TypeScript · Tailwind CSS · shadcn/ui · lucide-react · Motion (`motion/react`) ·
React Hook Form + Zod · Route Handlers + Resend (or Telegram Bot API) for forms ·
next/image · next/font · Metadata API + sitemap + robots · Vercel Analytics or GA4 · Vercel · pnpm.
GSAP only if the client asked for it. Sanity CMS only in the Premium package.

## Commands
- `pnpm dev` — dev server on http://localhost:3000
- `pnpm lint` / `pnpm typecheck` / `pnpm format`
- `pnpm build` then `pnpm start` — production build (needed for Lighthouse)
- `pnpm qa:visual [paths...]` — screenshots + layout checks at 375/768/1440 (dev server must run)
- `pnpm qa:lh` — Lighthouse summary (production server must run)
- shadcn component: `pnpm dlx shadcn@latest add <name>`

## Structure
- `app/` — routes; `app/layout.tsx` holds fonts, metadata defaults, analytics
- `app/api/contact/route.ts` — form endpoint
- `components/ui/` — shadcn (generated; edit only when needed)
- `components/sections/` — one file per landing section (Hero, Services, Pricing, FAQ, Contact…)
- `content/site.ts` — ALL texts, links, prices, contacts. Components never hardcode copy.
- `lib/` — `utils.ts` (cn), `schemas.ts` (Zod schemas shared by client and server)
- `public/` — images, favicons

## Conventions
- Server Components by default. `"use client"` only for interactivity (Motion, forms, toggles) and keep those components small.
- Mobile-first Tailwind. Check 375px first. No fixed widths on text containers.
- Colors, radii, fonts come from theme tokens — no raw hex values in components. Merge classes with `cn()`.
- Images: always `next/image` with `width`/`height` or `fill` + `sizes`. `priority` only on the hero (LCP) image.
- Fonts: `next/font`, max 2 families, `display: "swap"`.
- Animations: Motion only for enter/scroll reveals and small hovers; wrap the app in `<MotionConfig reducedMotion="user">`. Never animate layout-shifting properties on load.
- Forms: one Zod schema in `lib/schemas.ts` → `zodResolver` on the client AND `safeParse` in the route handler. Add a honeypot field. Return `{ ok: boolean, error?: string }`.
- Secrets only in env vars (`RESEND_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `CONTACT_TO_EMAIL`). Never `NEXT_PUBLIC_` for secrets. Keep `.env.example` updated.
- SEO: `metadata` in `app/layout.tsx` with `metadataBase`, title template, description, `openGraph`; `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.(png|tsx)`. Exactly one `<h1>` per page; `<html lang>` set.
- Accessibility: semantic tags (`header`, `main`, `section` with headings, `footer`), labels on all inputs, visible focus, links for navigation / buttons for actions, alt text on meaningful images (`alt=""` on decorative).
- TypeScript strict: no `any`, no unnecessary `!`.
- Never invent testimonials, reviews, client logos, stats or awards. Use clearly marked placeholders: `[PLACEHOLDER: ...]`.

## Definition of Done
1. Section/feature done → `pnpm lint` and `pnpm typecheck` pass.
2. Before showing the client → `pnpm build` passes, then I run (or ask you to run) `visual-qa` and `landing-auditor`. Target Lighthouse ≥ 90 in every category on mobile.
3. Before deploy → `code-reviewer` on the full diff, no Critical items left.

## Don't
- Don't install packages, change the stack, or add a CMS without asking.
- Don't edit `components/ui/` wholesale or reformat files you didn't change.
- Don't start long-running processes you don't stop; tell me which server must be running instead.

# Compact instructions
When compacting, keep: current task and its acceptance criteria, files changed, failing checks and their errors. Drop exploration output and old screenshots.
