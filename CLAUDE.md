# Project: Nudge AI landing (portfolio)

@AGENTS.md
<!-- Next.js rules for AI agents (created by create-next-app / next dev): read the bundled docs in node_modules/next/dist/docs/ before writing Next.js code. -->

Nudge AI is a fictional SaaS product that turns Slack conversations into tasks; the audience is teams that work in Slack, the main CTA is joining the waitlist.
Live URL: https://nudge-ai-lac.vercel.app

## Project status
<!-- Updated after every section. The only source of truth for progress. -->
- Business: Nudge AI — turns Slack conversations into tasks (fictional product, portfolio project)
- Design: my own, made in Claude Design (claude.ai), inspired by AI/SaaS landing pages
- Design reference: design/reference.html — the saved design page, 1440 px canvas (gitignored; not Figma)
- Phase: qa   <!-- scaffold | build | qa | done -->
- Tokens: ✅   <!-- ✅ when colors, fonts, type scale and spacing are in src/app/globals.css -->

| # | Section | id | Component | Status | Notes |
|---|---|---|---|---|---|
| 1 | Hero | `top` | `Hero` | ✅ | accepted exceptions only (see Decisions); page height at 1440 is +7px vs design (1–3px drifts, not chased) |
| 2 | Customers | `customers` | `Customers` | ✅ | |
| 3 | Features | `features` | `Features` | ✅ | 12–13px eyebrow accepted; card size matches design (208px at 1440) |
| 4 | Pricing | `pricing` | `Pricing` | ✅ | 12–13px badge/eyebrow accepted; card size matches design (396px at 1440) |
| 5 | Waitlist | `waitlist` | `Waitlist` | ✅ | |

Status: ⬜ not started · 🔄 in progress · ✅ done (layout rules OK at 360–2560 + lint/typecheck + committed)

## Stack
Next.js (App Router) + TypeScript · Tailwind CSS · shadcn/ui · lucide-react · Motion (`motion/react`) ·
React Hook Form + Zod · Route Handlers + Resend for the waitlist form ·
next/image · next/font · Metadata API + sitemap + robots · Vercel · pnpm.

## Commands
- `pnpm dev` — dev server on http://localhost:3000
- `pnpm lint` / `pnpm typecheck`
- `pnpm build` then `pnpm start` — production build
- `pnpm prod` — build + production server on http://localhost:3001 (needed for Lighthouse)
- `pnpm qa:visual [paths...]` — screenshots + layout checks (dev server must run)
- `pnpm qa:lh` — Lighthouse summary, 3 runs, against `pnpm prod` on http://localhost:3001
- `node scripts/section-check.mjs <section-id> [--widths 360,1920]` — layout rules for one section at 360–2560 → `.qa/sections/`. Works here without a spec: layout rules only, no pixel diff, and no `--page` mode
- shadcn component: `pnpm dlx shadcn@latest add <name>`

## Structure
- `src/app/` — routes; `src/app/layout.tsx` holds fonts and metadata defaults; `sitemap.ts`, `robots.ts`; `globals.css` holds the theme tokens
- `src/app/api/waitlist/route.ts` — waitlist form endpoint (Resend)
- `src/components/ui/` — shadcn and shared UI primitives (`button.tsx` is generated; edit only when needed)
- `src/components/sections/` — one file per landing section (Hero, Customers, Features, Pricing, Waitlist)
- `src/components/layout/` — Navbar, Footer, Providers
- `src/lib/` — `utils.ts` (cn), `schemas.ts` (Zod schemas shared by client and server)
- `public/` — images, favicons
- `design/` — `reference.html`, the saved design page (gitignored)

## Conventions
- Server Components by default. `"use client"` only for interactivity (Motion, forms, toggles) and keep those components small.
- Mobile-first Tailwind. Check 360px first.
- No fixed heights on text, cards or sections: no `h-*`, no `max-h-*` + `overflow-hidden` on text. Height comes from content; sections use `min-h-*`; text width via `max-w-*`. Fixed sizes only for icons, avatars, dots.
- Spacing between sections comes from the section padding itself.
- Colors, radii, fonts come from theme tokens — no raw hex values in components. Merge classes with `cn()`.
- Images: always `next/image` with `width`/`height` or `fill` + `sizes`. Only the hero (LCP) image gets `loading="eager"` + `fetchPriority="high"` (`priority` is deprecated in Next 16).
- Fonts: `next/font`, families as in the design, `display: "swap"`. An extra family gets its own token/utility; never swap `--font-sans` for one section.
- Animations: added at the end with `/animate` — CSS first (tokens in `globals.css`, `data-reveal` + one `RevealObserver`, hover via Tailwind classes), the Motion library only for what CSS can't do (exit, layout, drag). Never animate the first screen on load; only transform/opacity; everything respects `prefers-reduced-motion`.
- Animations: /animate standard package — tokens in `globals.css`, `<Reveal>` + `RevealObserver`, hover via tokens; first screen never animated.
- Forms: one Zod schema in `src/lib/schemas.ts` → `zodResolver` on the client AND `safeParse` in the route handler. Add a honeypot field. Return `{ ok: boolean, error?: string }`.
- Secrets only in env vars (`RESEND_API_KEY`, `NOTIFICATION_EMAIL`). Never `NEXT_PUBLIC_` for secrets. Keep `.env.example` updated.
- SEO: `metadata` in `src/app/layout.tsx` with `metadataBase`, title template, description, `openGraph`; `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/opengraph-image.(png|tsx)`. Exactly one `<h1>` per page; `<html lang>` set.
- Accessibility: semantic tags (`header`, `main`, `section` with headings, `footer`), labels on all inputs, visible focus, links for navigation / buttons for actions, alt text on meaningful images (`alt=""` on decorative).
- TypeScript strict: no `any`, no unnecessary `!`.
- Never invent testimonials, reviews, client logos, stats or awards as real claims. Design copy is rendered verbatim; fake copy is marked with a `// PLACEHOLDER: ...` comment above the field — never inside the rendered text or `alt`. `alt` describes the image.

## Decisions
<!-- Deliberate choices with a date, one line each (accepted Lighthouse score, placeholder links, skipped features…).
     Reviewers and agents read this and must not report these as problems. -->
- 2026-11-09: portfolio project — customer logos, pricing and product copy are samples, not real claims.
- 2026-11-11: portfolio project — links to non-existent pages (Changelog, Integrations, About, Blog, Careers, Contact, Privacy, Terms, Security) are `href="#"` placeholders, not broken links; the Hero beta pill points to `#waitlist`.
- 2026-11-11: Waitlist footnote differs from the design on purpose (there is no mailing list, so "Unsubscribe anytime" would be false).
- 2026-11-11: 12–13px text in badges (Beta, Most popular), eyebrow labels and the Inbox mockup is kept as in the design; section-check's "text < 14px" there is expected. The beta pill text is `text-sm` (14px).
- 2026-11-11: the Beta pill tap target is extended to 44px with an `::after` hit area; section-check measures the box only, so it still reports 36px on mobile.
- 2026-11-11: radii use the default Tailwind scale (md 6 / lg 8 / xl 12 / 2xl 16, as in the design); the shadcn `--radius-*` overrides and `--radius` were removed from `globals.css`. Design text with `line-height: normal` uses `leading-[normal]`.
- 2026-11-11: no robots/noindex logic per environment: Vercel adds `X-Robots-Tag: noindex` to preview deployments itself, and there is no custom domain on a branch.
- 2026-11-11: `cn` comes from the `cn` package (merges conflicting Tailwind classes, replaces clsx + tailwind-merge) — keep it. No `global-error.tsx`.
- 2026-11-11: no rate limit on `/api/waitlist` (portfolio project, Resend test sender); only honeypot, 1024-char body cap (413) and `email.max(254)`.
- 2026-11-09: waitlist sends from onboarding@resend.dev (Resend test sender: delivers only to the Resend account owner's email); without env vars the form returns 503 by design.

## Definition of Done
1. Section/feature done → `pnpm lint` and `pnpm typecheck` pass.
2. Before showing the client → `pnpm build` passes, then I run (or ask you to run) `visual-qa` and `landing-auditor`. Target Lighthouse ≥ 90 in every category on mobile.
3. Before deploy → `code-reviewer` on the full diff, no Critical items left.

## Don't
- Don't install packages, change the stack, or add a CMS without asking.
- Don't edit `src/components/ui/` wholesale or reformat files you didn't change.
- Don't start or stop the dev / production servers (`pnpm dev`, `pnpm prod`) — if a check needs one, ask me to start it.
- Don't rewrite files with shell commands — Edit/Write only, so the diff is visible. Line endings are normalized by `.gitattributes`; don't "fix" them with scripts.

# Compact instructions
When compacting, keep: current task and its acceptance criteria, files changed, failing checks and their errors. Drop exploration output and old screenshots.
