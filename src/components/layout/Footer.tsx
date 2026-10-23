import Link from "next/link";

const productLinks = ["Features", "Pricing", "Changelog", "Integrations"];
const companyLinks = ["About", "Blog", "Careers", "Contact"];
const legalLinks = ["Privacy", "Terms", "Security"];

export default function Footer() {
  return (
    <footer className="px-5 pt-16 pb-10">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-x-8 gap-y-10">
          {/* Brand */}
          <div className="col-span-2 md:col-auto flex flex-col gap-[14px]">
            <Link
              href="#top"
              aria-label="Nudge AI home"
              className="flex items-center gap-[10px] font-semibold text-base text-foreground"
            >
              <span className="w-[26px] h-[26px] rounded-[7px] bg-primary inline-flex items-center justify-center shrink-0">
                <svg
                  width="14"
                  height="14"
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
            <p className="text-sm leading-relaxed text-muted-foreground max-w-[280px]">
              Turns team conversations into tasks that actually get done.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 text-[13px] font-semibold text-foreground">Product</h3>
            <ul className="flex flex-col gap-3 text-sm">
              {productLinks.map((label) => (
                <li key={label}>
                  <Link
                    href={`#${label.toLowerCase()}`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-[13px] font-semibold text-foreground">Company</h3>
            <ul className="flex flex-col gap-3 text-sm">
              {companyLinks.map((label) => (
                <li key={label}>
                  <Link
                    href={`#${label.toLowerCase()}`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-[13px] font-semibold text-foreground">Legal</h3>
            <ul className="flex flex-col gap-3 text-sm">
              {legalLinks.map((label) => (
                <li key={label}>
                  <Link
                    href={`#${label.toLowerCase()}`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
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
