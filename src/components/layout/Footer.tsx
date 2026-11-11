// Links with href="#" are portfolio placeholders (see Decisions in CLAUDE.md)
const productLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Changelog", href: "#" },
  { label: "Integrations", href: "#" },
];
const companyLinks = ["About", "Blog", "Careers", "Contact"].map((label) => ({ label, href: "#" }));
const legalLinks = ["Privacy", "Terms", "Security"].map((label) => ({ label, href: "#" }));

const columns = [
  { title: "Product", links: productLinks },
  { title: "Company", links: companyLinks },
  { title: "Legal", links: legalLinks },
];

export default function Footer() {
  return (
    <footer className="px-5 pt-16 pb-10">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-x-8 gap-y-10">
          {/* Brand */}
          <div className="col-span-2 md:col-auto flex flex-col gap-[14px]">
            <a
              href="#top"
              aria-label="Nudge AI home"
              className="flex items-center gap-[10px] font-semibold text-base text-foreground"
            >
              <span className="w-[26px] h-[26px] rounded-[7px] bg-primary text-primary-foreground inline-flex items-center justify-center shrink-0">
                <svg
                  width="14"
                  height="14"
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
            <p className="text-sm leading-relaxed text-muted-foreground max-w-[280px]">
              Turns team conversations into tasks that actually get done.
            </p>
          </div>

          {columns.map(({ title, links }) => (
            <div key={title}>
              <h3 className="mb-4 text-[13px] font-semibold text-foreground">{title}</h3>
              <ul className="flex flex-col gap-3 text-sm">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-border flex flex-wrap justify-between gap-3 text-[13px] text-muted-foreground">
          <span>© 2026 Nudge AI. All rights reserved.</span>
          <span>Made for teams who talk in Slack.</span>
        </div>
      </div>
    </footer>
  );
}
