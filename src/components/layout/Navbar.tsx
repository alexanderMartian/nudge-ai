"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion } from "motion/react";

const navLinks = ["Features", "Pricing", "Changelog"] as const;

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 border-b border-border bg-background"
    >
      <nav
        aria-label="Main"
        className="max-w-[1200px] mx-auto px-5 h-[68px] flex items-center justify-between gap-6"
      >
        {/* Logo */}
        <Link
          href="#top"
          aria-label="Nudge AI home"
          className="flex items-center gap-[10px] font-semibold text-[17px] tracking-[-0.01em] text-foreground"
        >
          <span className="w-7 h-7 rounded-lg bg-primary inline-flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.5)] shrink-0">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h10" />
              <path d="M11 6l6 6-6 6" />
            </svg>
          </span>
          <span>Nudge AI</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-9 text-sm font-medium">
          {navLinks.map((label) => (
            <Link
              key={label}
              href={`#${label.toLowerCase()}`}
              className="text-subtle hover:text-foreground transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="#waitlist"
            className="inline-flex items-center h-10 px-4 rounded-[10px] bg-primary text-primary-foreground text-sm font-semibold whitespace-nowrap transition-all hover:brightness-[1.08] hover:shadow-[0_0_28px_rgba(124,58,237,0.55)]"
          >
            Join waitlist
          </Link>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            className="md:hidden w-11 h-11 inline-flex items-center justify-center bg-transparent border border-border rounded-[10px] text-foreground cursor-pointer"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu — fixed overlay, does not affect document flow */}
      {open && (
        <div className="md:hidden fixed inset-x-0 top-[69px] z-40 border-t border-border bg-background px-5 py-4 flex flex-col gap-4 text-sm font-medium shadow-lg">
          {navLinks.map((label) => (
            <Link
              key={label}
              href={`#${label.toLowerCase()}`}
              onClick={() => setOpen(false)}
              className="text-subtle hover:text-foreground transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </motion.header>
  );
}
