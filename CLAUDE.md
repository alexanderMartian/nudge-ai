# Nudge AI — Project Rules

## Language
All Claude responses must be in English only.

## Product
Dark SaaS landing page for **Nudge AI**. Single-purpose marketing site; no auth, no dashboard.

## Stack
- **Framework:** Next.js 16 App Router (`app/` directory, Server Components by default)
- **Language:** TypeScript — strict mode, no `any`
- **Styling:** Tailwind CSS v4 (CSS-first config, no `tailwind.config.ts`)
- **Components:** shadcn/ui canary (`shadcn@^4`, `radix-ui`, `class-variance-authority`)
- **Animation:** Motion v14 (`motion/react`) — prefer `<motion.*>` over `animate()`
- **Forms:** React Hook Form v7 + Zod v4 (`@hookform/resolvers/zod`)
- **Icons:** lucide-react
- **Package manager:** pnpm — never use npm or yarn
- **Deploy:** Vercel — keep bundle lean, avoid heavy client-side libs

## Design tokens
| Token | Value |
|-------|-------|
| Background | `#0A0A0F` |
| Accent / primary | `#7C3AED` (violet-600) |
| Font | Geist Sans (headings) · Inter (body) — both via `next/font` |

Use CSS variables defined in `app/globals.css`. Never hardcode hex values in component files — use the variable names (e.g. `bg-background`, `text-accent`).

## File & folder conventions
- Pages: `app/(marketing)/page.tsx` pattern
- Components: `components/ui/` (shadcn primitives) · `components/sections/` (page sections) · `components/layout/` (nav, footer)
- Hooks: `hooks/`
- Types: `types/`
- Lib / utils: `lib/utils.ts` (`cn` helper already present)

## Coding rules
1. **Server Components first** — add `"use client"` only when state, effects, or browser APIs are needed.
2. **No `useEffect` for data** — fetch in Server Components or Route Handlers.
3. **Forms** — always use React Hook Form + Zod; never raw `useState` for form state.
4. **Motion** — wrap animated sections in `<motion.section>` with `viewport={{ once: true }}`; respect `prefers-reduced-motion` via `useReducedMotion()`.
5. **shadcn components** — add via `pnpm dlx shadcn@canary add <component>`, never copy-paste manually.
6. **Tailwind v4** — use `@theme` block in `globals.css` for custom tokens; utility classes only, no inline `style={}` unless absolutely necessary.
7. **Images** — use `next/image` with explicit `width`/`height` or `fill`; WebP/AVIF preferred.
8. **Accessibility** — every interactive element needs keyboard focus styles and ARIA labels where content is non-descriptive.

## What NOT to do
- Don't install new dependencies without asking.
- Don't create a `tailwind.config.ts` — v4 uses CSS config.
- Don't use `pages/` directory — App Router only.
- Don't use `styled-components`, `emotion`, or CSS Modules.
- Don't add `console.log` to committed code.
- Don't touch `pnpm-lock.yaml`, `.next/`, or `node_modules/` directly.
