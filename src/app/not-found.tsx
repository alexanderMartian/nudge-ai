import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main className="px-5 py-[112px] min-h-[60vh] flex flex-col items-center justify-center text-center">
      <p className="text-sm font-semibold text-accent-lighter">404</p>
      <h1 className="mt-3 text-4xl font-bold tracking-[-0.03em]">Page not found</h1>
      <p className="mt-4 max-w-[420px] text-muted-foreground">
        This page doesn&apos;t exist or has moved. Let&apos;s get you back on track.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center h-12 px-[22px] rounded-xl bg-primary text-primary-foreground text-[15px] font-semibold transition-[filter,box-shadow] duration-(--motion-fast) ease-standard hover:brightness-[1.08] hover:shadow-glow-hover"
      >
        Back to home
      </Link>
    </main>
  );
}
