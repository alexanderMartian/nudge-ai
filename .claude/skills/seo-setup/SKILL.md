---
name: seo-setup
description: Adds production-ready SEO to a Next.js (App Router, Next 16) landing page — one site-URL variable, metadata with title template, OpenGraph/Twitter via the opengraph-image file convention, favicon/apple icon, viewport theme color, sitemap, robots that block indexing outside production, and JSON-LD for a local business (LocalBusiness or its subtype) or a plain WebSite for portfolio/fictional projects. Use when the user runs /seo-setup or asks to add SEO to a landing page.
---

# SEO setup — procedure (local business landing)

Before starting:
- Read the Next.js docs bundled in `node_modules/next/dist/docs/` for Metadata, `opengraph-image`, `icon`, `sitemap`, `robots`, `viewport` — follow them where this file differs.
- Read `CLAUDE.md` (Business, Package, Live URL, site language) and `content/site.ts` (name, address, phone, hours, socials, menu).
- Decide the **mode** and tell the user in one line:
  - **Real business** (a client) → JSON-LD `LocalBusiness` or its subtype (step 6).
  - **Portfolio / fictional business** (`Package: portfolio` or the user says so) → JSON-LD `WebSite` only. Never put an invented address, phone or hours into structured data — Google requires it to describe a real business.
- Missing facts (site URL, address, phone, hours) → ask once, in one message. Never invent them.

Work through the steps in order. Copy for title/description comes from the page content, in the site's language.

## Step 1 — one site URL (`lib/site-url.ts`)
```ts
// Production URL: NEXT_PUBLIC_SITE_URL, else the Vercel production domain, else local dev.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

// Index only the production deployment (Vercel previews and local builds stay out of Google).
export const IS_PRODUCTION = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : process.env.NODE_ENV === "production";
```
Add `NEXT_PUBLIC_SITE_URL=` (commented, with the real domain as an example) to `.env.example`. Use `SITE_URL` everywhere below — never hard-code the domain.

## Step 2 — metadata in `app/layout.tsx`
Keep the existing layout JSX. Add or merge:
```tsx
import type { Metadata, Viewport } from "next";
import { SITE_URL, IS_PRODUCTION } from "@/lib/site-url";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "<Business> — <value prop>",   // ≤ 60 chars
    template: "%s | <Business>",
  },
  description: "<140–160 chars: what, for whom, where (city for a local business), main CTA>",
  alternates: { canonical: "/" },
  robots: IS_PRODUCTION ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "<Business>",
    locale: "<en_US | uk_UA>",
    title: "<same as title.default>",
    description: "<same as description>",
  },
  twitter: { card: "summary_large_image" },  // X falls back to the og:* tags
};

export const viewport: Viewport = {
  themeColor: "<page background or brand color from app/globals.css>",
};
```
- Don't list OG images here — step 3 adds them through the file convention.
- `<html lang>`: `en` / `uk` … as the site language.

## Step 3 — social preview image (`app/opengraph-image.*`)
Next.js adds `og:image` (+ size, type, alt) automatically for `app/opengraph-image.png|jpg` (1200×630) with `app/opengraph-image.alt.txt`.
- If the user has an image → put it there (≤ 1 MB). Remove any `public/opengraph-image.png` reference.
- If not → ask. Offer, with the user's OK, a generated card `app/opengraph-image.tsx` (`ImageResponse`: business name + one line + brand colors, no invented photos). Never invent a photo.

## Step 4 — icons
- `app/icon.svg` or `app/icon.png` (from the logo; 32×32+ for PNG) and `app/apple-icon.png` (180×180).
- Delete the create-next-app `app/favicon.ico` if it is still the default Next/Vercel icon.
- No logo file → ask; don't draw one.

## Step 5 — `app/sitemap.ts` and `app/robots.ts`
```ts
// app/sitemap.ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

const LAST_UPDATED = new Date("<YYYY-MM-DD of the last content change>");

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL, lastModified: LAST_UPDATED }];
}
```
```ts
// app/robots.ts
import type { MetadataRoute } from "next";
import { SITE_URL, IS_PRODUCTION } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  if (!IS_PRODUCTION) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return { rules: [{ userAgent: "*", allow: "/" }], sitemap: `${SITE_URL}/sitemap.xml` };
}
```
Never disallow `/_next/` — Google needs it to render the page.

## Step 6 — JSON-LD (in `app/layout.tsx`, inside `<body>`)
Render once, escaped against XSS:
```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
/>
```
**Portfolio / fictional** → only:
```ts
const jsonLd = { "@context": "https://schema.org", "@type": "WebSite", name: "<Business>", url: SITE_URL };
```
**Real local business** → `@graph` with the business and the website. Pick the most specific type:

| Business | `@type` |
|---|---|
| café, coffee shop | `CafeOrCoffeeShop` |
| restaurant | `Restaurant` |
| bakery | `Bakery` |
| bar, pub | `BarOrPub` |
| beauty salon | `BeautySalon` |
| hair salon, barber | `HairSalon` |
| dentist | `Dentist` |
| gym, fitness studio | `ExerciseGym` |
| car repair | `AutoRepair` |
| hotel | `Hotel` |
| other with a physical address | `LocalBusiness` |
| no physical place (online service) | `Organization` (+ `areaServed`) |

Extend this table when a new kind of client appears.
```ts
const business = {
  "@type": "<type from the table>",
  "@id": `${SITE_URL}/#business`,
  name: "<Business>",
  url: SITE_URL,
  image: `${SITE_URL}/opengraph-image.png`, // the URL Next renders in og:image — check the built page and copy it
  telephone: "<+380…>",
  priceRange: "<₴₴ | $$>",
  address: {
    "@type": "PostalAddress",
    streetAddress: "<…>",
    addressLocality: "<city>",
    postalCode: "<…>",
    addressCountry: "<UA>",
  },
  geo: { "@type": "GeoCoordinates", latitude: 0, longitude: 0 }, // only if the user gave coordinates
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:00", closes: "20:00" },
  ],
  sameAs: ["<Instagram URL>", "<Facebook URL>"],
  // food places only:
  servesCuisine: "<Coffee, Desserts>",
  menu: `${SITE_URL}/#coffee-menu`,
  acceptsReservations: false,
};
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [business, { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: "<Business>", url: SITE_URL, publisher: { "@id": `${SITE_URL}/#business` } }],
};
```
Required by Google: `name`, `address`. Everything else only if it is real (from `content/site.ts` or the user). Keep the values in `content/site.ts` (a `business` object) and build `jsonLd` from it, so text on the page and structured data never disagree.

## After all steps
1. `pnpm typecheck`, `pnpm lint`, `pnpm build` — report errors.
2. List what was created/changed, one line each, and what is still missing (OG image, icon, address…).
3. After deploy, check (tell the user):
   - Rich Results Test — https://search.google.com/test/rich-results (LocalBusiness detected, no errors)
   - Schema validator — https://validator.schema.org
   - Social preview — https://developers.facebook.com/tools/debug/ or https://www.opengraph.xyz
   - `<SITE_URL>/sitemap.xml`, `<SITE_URL>/robots.txt`; a preview deployment's `robots.txt` must say `Disallow: /`
   - Google Search Console: add the domain, submit the sitemap. Google Business Profile matters more than JSON-LD for Maps — remind the client.
