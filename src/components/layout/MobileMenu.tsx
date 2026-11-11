"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

export default function MobileMenu({ links }: { links: readonly { label: string; href: string }[] }) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="md:hidden w-11 h-11 inline-flex items-center justify-center bg-transparent border border-border rounded-[10px] text-foreground cursor-pointer"
      >
        {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
      </button>

      {/* Fixed overlay, does not affect document flow */}
      {open && (
        <div
          id="mobile-menu"
          className="md:hidden fixed inset-x-0 top-[68px] z-40 border-t border-border bg-background px-5 py-2 flex flex-col text-sm font-medium shadow-lg"
        >
          {links.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center min-h-11 text-subtle hover:text-foreground transition-colors duration-(--motion-fast) ease-standard"
            >
              {label}
            </a>
          ))}
        </div>
      )}
    </>
  );
}
