import MobileMenu from "@/components/layout/MobileMenu";

const navLinks = ["Features", "Pricing", "Changelog"] as const;

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <nav
        aria-label="Main"
        className="max-w-[1200px] mx-auto px-5 h-[68px] flex items-center justify-between gap-6"
      >
        {/* Logo */}
        <a
          href="#"
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
        </a>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-9 text-sm font-medium">
          {navLinks.map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase()}`}
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
            className="inline-flex items-center h-10 px-4 rounded-[10px] bg-primary text-primary-foreground text-sm font-semibold whitespace-nowrap transition-[filter,box-shadow] duration-(--motion-fast) ease-standard hover:brightness-[1.08] hover:shadow-[0_0_28px_rgba(124,58,237,0.55)]"
          >
            Join waitlist
          </a>
          <MobileMenu links={navLinks} />
        </div>
      </nav>
    </header>
  );
}
