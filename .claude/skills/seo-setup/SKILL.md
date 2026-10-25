---
name: seo-setup
description: Adds production-ready SEO to a Next.js App Router landing page — metadataBase, title template, OpenGraph, Twitter Card, sitemap.ts, robots.ts, JSON-LD, og-image placeholder, and lang attribute. Use when the user runs /seo-setup or asks to add SEO to a landing page.
---

# SEO setup — procedure

Read `CLAUDE.md` for the project's real URL, client name and site language before starting. If the URL is missing, ask once.

Work through the steps in order. After all changes, run `pnpm typecheck` and report the result.

## Step 1 — metadataBase + title template in `app/layout.tsx`

Add a `metadata` export with `metadataBase`, `title.template`, `description`, `robots`, and `alternates.canonical`. Keep the existing layout JSX untouched.

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://<SITE_URL>"),
  title: {
    default: "<Site name> — <one-line value prop, ≤60 chars total>",
    template: "%s | <Site name>",
  },
  description: "<140–160 chars: who it's for, what it does, main CTA>",
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};
```

## Step 2 — OpenGraph + Twitter Card

Add to the same `metadata` export in `layout.tsx`:

```tsx
openGraph: {
  type: "website",
  url: "https://<SITE_URL>",
  siteName: "<Site name>",
  title: "<same as metadata.title.default>",
  description: "<same as metadata.description>",
  images: [
    {
      url: "/opengraph-image.png",
      width: 1200,
      height: 630,
      alt: "<Site name> — <short description>",
    },
  ],
},
twitter: {
  card: "summary_large_image",
  title: "<same as metadata.title.default>",
  description: "<same as metadata.description>",
  images: [{ url: "/opengraph-image.png", alt: "<Site name> — <short description>" }],
},
```

## Step 3 — `<html lang>`

In `app/layout.tsx`, set `lang` on the `<html>` element:
- English site → `lang="en"`
- Ukrainian site → `lang="uk"`

## Step 4 — `app/sitemap.ts`

Create the file. For a single-page landing, include only the homepage:

```ts
import type { MetadataRoute } from "next";

const SITE_URL = "https://<SITE_URL>";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
```

## Step 5 — `app/robots.ts`

Create the file. Never disallow `/_next/` — Googlebot needs it to render the page:

```ts
import type { MetadataRoute } from "next";

const SITE_URL = "https://<SITE_URL>";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
```

## Step 6 — JSON-LD (Organization schema)

Add a `<script type="application/ld+json">` block inside the `<body>` in `app/layout.tsx`. Escape `<` to prevent XSS:

```tsx
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "<Site name>",
  url: "https://<SITE_URL>",
  description: "<same as metadata.description>",
};

// Inside <body>, before {children}:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
  }}
/>
```

## Step 7 — OG image placeholder

Check if `public/opengraph-image.png` exists. If not, create a note for the user:

> `public/opengraph-image.png` is missing. Add a 1200×630px image before launch — use the site's hero visual or a branded graphic. Until then, social previews will show no image.

Do NOT generate or invent an image. Just tell the user what's needed.

## After all steps

1. Run `pnpm typecheck` — report any errors.
2. Tell the user what was created/changed (one line each).
3. Remind: commit, push to Vercel, then verify with:
   - https://developers.facebook.com/tools/debug/ (OG tags)
   - https://search.google.com/test/rich-results (JSON-LD)
   - `<SITE_URL>/sitemap.xml` in browser
   - `<SITE_URL>/robots.txt` in browser