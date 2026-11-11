import MobileMenu from "@/components/layout/MobileMenu";

// Changelog is a portfolio placeholder (see Decisions in CLAUDE.md)
const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Changelog", href: "#" },
] as const;

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <nav
        aria-label="Main"
        className="max-w-[1200px] mx-auto px-5 h-[68px] flex items-center justify-between gap-6"
      >
        {/* Logo */}
        <a
          href="#top"
          aria-label="Nudge AI home"
          className="flex items-center gap-[10px] font-semibold text-[17px] tracking-[-0.01em] text-foreground"
        >
          <span className="w-7 h-7 rounded-lg bg-primary text-primary-foreground inline-flex items-center justify-center shadow-logo-glow shrink-0">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
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
        </a>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-9 text-sm font-medium">
          {navLinks.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-subtle hover:text-foreground transition-colors duration-(--motion-fast) ease-standard"
            >
              {label}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <a
            href="#waitlist"
            className="inline-flex items-center h-10 px-4 rounded-[10px] bg-primary text-primary-foreground text-sm font-semibold whitespace-nowrap transition-[filter,box-shadow] duration-(--motion-fast) ease-standard hover:brightness-[1.08] hover:shadow-glow-hover"
          >
            Join waitlist
          </a>
          <MobileMenu links={navLinks} />
        </div>
      </nav>
    </header>
  );
}
