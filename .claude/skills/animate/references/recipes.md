# Animation recipes (CSS first)

All code assumes Next.js App Router + Tailwind v4. Copy, then adapt names. Text files are edited with Edit/Write.

## 1. Motion tokens — `app/globals.css`
```css
@theme {
  /* Tailwind v4: --ease-* become utilities (ease-enter, ease-exit, ease-standard) */
  --ease-enter: cubic-bezier(0, 0, 0.2, 1);       /* decelerate — things arriving */
  --ease-exit: cubic-bezier(0.4, 0, 1, 1);        /* accelerate — things leaving for good */
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);  /* moving / changing on screen */
}

:root {
  --motion-fast: 150ms;      /* hover, focus, color */
  --motion-base: 250ms;      /* buttons, menus, accordions, card lift */
  --motion-reveal: 500ms;    /* sections and cards entering on scroll */
  --motion-stagger: 70ms;    /* delay between items of one list */
  --reveal-distance: 24px;   /* how far an item travels while appearing */
}
```
Use in classes: `duration-(--motion-fast) ease-standard`. Never `transition-all` — name the properties
(`transition-colors`, `transition-opacity`, `transition-[translate]`).

## 2. Reveal on scroll — CSS + one observer for the whole page
Content is visible by default. Only elements that are **below the viewport when the page loads** get hidden, and
only after JavaScript runs — so the first screen, LCP and no-JS visitors are never affected.

`app/globals.css`:
```css
@media (prefers-reduced-motion: no-preference) {
  [data-reveal="pending"] {
    opacity: 0;
    translate: 0 var(--reveal-distance);
  }
  /* "shown" only adds the transition: the element returns to its own opacity/translate and that change animates */
  [data-reveal="shown"] {
    transition:
      opacity var(--motion-reveal) var(--ease-enter),
      translate var(--motion-reveal) var(--ease-enter);
    transition-delay: calc(min(var(--reveal-index, 0), 6) * var(--motion-stagger));
  }
}
```

`components/RevealObserver.tsx`:
```tsx
"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// One IntersectionObserver for every [data-reveal] element on the page. Sections stay Server Components:
// they only add the attribute. Elements already on screen at load are left alone (no animation, no LCP delay).
export default function RevealObserver() {
  const pathname = usePathname(); // re-scan after client-side navigation to another page
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-reveal", "shown");
          io.unobserve(entry.target);
        }
      },
      // 10% of the element visible. Not a negative bottom rootMargin: an element at the very end of the page could
      // never reach that zone and would stay invisible.
      { threshold: 0.1 },
    );
    for (const el of document.querySelectorAll<HTMLElement>("[data-reveal]")) {
      if (el.dataset.reveal === "shown") continue; // already revealed (e.g. footer in the layout)
      if (el.getBoundingClientRect().top < window.innerHeight) continue; // on screen now — never hide it
      el.setAttribute("data-reveal", "pending");
      io.observe(el);
    }
    return () => io.disconnect();
  }, [pathname]);
  return null;
}
```
Mount once at the end of `<body>` in `app/layout.tsx`: `<RevealObserver />`.

`components/Reveal.tsx` — the only way sections use the reveal (Server Component, no `"use client"`):
```tsx
import type { CSSProperties, ElementType, ComponentPropsWithoutRef } from "react";

type RevealProps<T extends ElementType> = {
  as?: T;
  /** Stagger position inside a group; becomes --reveal-index. */
  index?: number;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "index">;

// RevealObserver flips data-reveal to "pending"/"shown" on the client — often BEFORE below-the-fold sections hydrate
// (React hydrates in chunks). The attribute then differs from the server HTML on purpose; suppressHydrationWarning
// silences that for this element's own attributes only (children are still checked).
export default function Reveal<T extends ElementType = "div">({ as, index, style, ...props }: RevealProps<T>) {
  const Tag: ElementType = as ?? "div";
  const mergedStyle = index === undefined ? style : ({ ...style, "--reveal-index": index } as CSSProperties);
  return <Tag data-reveal="" suppressHydrationWarning style={mergedStyle} {...props} />;
}
```
Never write a raw `data-reveal` attribute in a section — without `suppressHydrationWarning` the dev console shows
"A tree hydrated but some attributes … didn't match" (Coffea: seen only on the dev server; production is silent, so
run `visual-check` on dev too).

Use in sections (Server Components):
```tsx
<Reveal>{/* heading + intro of a section */}</Reveal>
<Reveal as="h2" className="…">{title}</Reveal>

<ul className="grid …">
  {items.map((item, i) => (
    <Reveal as="li" key={item.id} index={i}>
      <ProductCard {...item} />
    </Reveal>
  ))}
</ul>
```
- Put `<Reveal>` on a **wrapper**, not on a link/button and not on an element with its own `transition-*`,
  `opacity-*` or `translate-*` classes (the reveal CSS is unlayered and would override them).
- Never on Header, Hero or anything in the first viewport. Never on `<section>` itself if the section has a
  background — reveal its content, so the background doesn't flash.
- Stagger is capped at 6 items (`min(…, 6)`), so long lists don't wait seconds for the last card.
- Horizontal carousels: reveal the row once, not each card (cards 5+ are off-screen sideways), with `<Reveal>`
  around the scroll container.
- Images with `mix-blend-*` (and their ancestors): no reveal, no zoom — see section 7.
- Decorative, absolutely positioned images: fade only — `style={{ "--reveal-distance": "0px" }}`.

## 3. Smooth scrolling to anchors
```tsx
<html lang="en" className="motion-safe:scroll-smooth" data-scroll-behavior="smooth">
```
`motion-safe:` keeps instant jumps for people with reduced motion. Check the bundled Next docs about
`data-scroll-behavior` (Next disables smooth scrolling during route changes when it is set).
A fixed/sticky header covering the target → `scroll-mt-*` on the target section.
Scroll containers (carousels) follow the same rule: `motion-safe:scroll-smooth`, never plain `scroll-smooth`; in JS
`el.scrollBy({ left, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })`.

## 4. Hover and press
Buttons and links (color only — cheap, not "motion" for WCAG):
```tsx
className="transition-colors duration-(--motion-fast) ease-standard hover:bg-primary/90"
```
Card lift — move with `translate`, show the shadow by fading a pre-rendered layer (animating `box-shadow`
repaints every frame):
```tsx
<article className="group relative transition-[translate] duration-(--motion-base) ease-standard motion-safe:hover:-translate-y-1">
  <span
    aria-hidden
    className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-lg opacity-0 transition-opacity duration-(--motion-base) group-hover:opacity-100"
  />
  …
</article>
```
Tailwind v4 already wraps `hover:` in `@media (hover: hover)`, so touch screens don't get stuck hover states.
Image zoom inside a card: `overflow-hidden` on the frame, `transition-[scale] duration-(--motion-base)
motion-safe:group-hover:scale-105` on the image.

## 5. Scroll-linked effects (progress bar, gentle parallax) — progressive only
CSS scroll-driven animations work in Chrome/Edge and Safari 26+, not in Firefox stable (2026). The finished state
must be the default:
```css
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .parallax-soft {
      animation: parallax-soft linear both;
      animation-timeline: view();
      animation-range: entry 0% exit 100%;
    }
  }
}
@keyframes parallax-soft { from { translate: 0 -24px; } to { translate: 0 24px; } }
```
Keep it subtle (≤ 24–40 px), decorative elements only, never text the user is reading.

## 6. When CSS is not enough — Motion, lazily
Use Motion only for: exit animations of elements leaving the DOM (`AnimatePresence`), layout animations,
drag/pan, spring physics, orchestrated sequences. Never for reveal-on-scroll or hover.
```tsx
// components/motion/MotionProvider.tsx
"use client";
import { LazyMotion, MotionConfig } from "motion/react";

const loadFeatures = () => import("./features").then((mod) => mod.default);

export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadFeatures} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
```
```ts
// components/motion/features.ts
import { domAnimation } from "motion/react";
export default domAnimation; // ~24 KB, loaded after the first render; domMax only for drag/layout
```
```tsx
// inside a client component
import * as m from "motion/react-m";
<m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} />
```
`m` + `LazyMotion` ≈ 5 KB at first render instead of ~43 KB for `motion`. Wrap only the subtree that needs it.

## 7. Never
- Animate the first viewport on load (Header, Hero text, Hero image) — Chrome ignores `opacity: 0` paints for LCP,
  so a fade-in moves LCP to the end of the animation or later.
- Animate `width`, `height`, `top`, `left`, `margin`, `padding`, `font-size` — layout every frame, jank and CLS.
  Use `transform`/`translate`/`scale`/`opacity`.
- Animate an image with `mix-blend-multiply` (or any element above it in the tree): `opacity < 1`, `translate`,
  `scale`, `filter`, `clip-path` create a new stacking context, the image then blends with transparency instead of the
  section background, and its white background flashes as a box. Fix the asset instead: a real cut-out, or the
  multiply baked into an alpha PNG for that flat background colour.
- Animate hover lift on a card that is not clickable — lift means "click me". Image zoom is enough.
- `transition-all`, `will-change` everywhere (only for a proven problem), animating `box-shadow`/`filter: blur` on
  large areas.
- Auto-playing loops longer than 5 s without a pause control (WCAG 2.2.2); auto-advancing carousels.
- Motion that ignores `prefers-reduced-motion` (WCAG 2.3.3): translate/scale/parallax are off; colour and opacity
  changes may stay.
- Durations under 100 ms (invisible) or over ~600 ms for UI (feels slow); bounce/elastic easing on a business
  landing.
