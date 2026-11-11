import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RevealObserver from "@/components/ui/RevealObserver";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://nudge-ai-lac.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Nudge AI — Turn Slack conversations into tasks",
    template: "%s | Nudge AI",
  },
  description:
    "Nudge AI reads your team's Slack conversations, extracts every request and promise, and turns them into tasks — so nothing gets lost in a thread.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Nudge AI",
    title: "Nudge AI — Turn Slack conversations into tasks",
    description:
      "Nudge AI reads your team's Slack conversations, extracts every request and promise, and turns them into tasks — so nothing gets lost in a thread.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Nudge AI — Turn Slack conversations into tasks",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nudge AI — Turn Slack conversations into tasks",
    description:
      "Nudge AI reads your team's Slack conversations, extracts every request and promise, and turns them into tasks — so nothing gets lost in a thread.",
    images: [{ url: "/opengraph-image.png", alt: "Nudge AI — Turn Slack conversations into tasks" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Nudge AI",
  url: SITE_URL,
  description:
    "Nudge AI reads your team's Slack conversations, extracts every request and promise, and turns them into tasks — so nothing gets lost in a thread.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} motion-safe:scroll-smooth`}
      data-scroll-behavior="smooth"
    >
      <body className="bg-background text-foreground antialiased overflow-x-hidden" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <Navbar />
        {children}
        <Footer />
        <RevealObserver />
      </body>
    </html>
  );
}
