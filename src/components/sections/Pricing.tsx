import Link from "next/link";
import Reveal from "@/components/ui/Reveal";

const CheckIcon = () => (
  <svg
    className="text-accent-light"
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
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export default function Pricing() {
  return (
    <section id="pricing" className="px-5 pt-10 pb-[104px] scroll-mt-20">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <Reveal className="max-w-[640px] mx-auto mb-14 text-center">
          <p className="mb-3 text-[13px] font-semibold tracking-[.08em] uppercase text-accent-light">
            Pricing
          </p>
          <h2
            className="font-bold tracking-[-0.03em] leading-[1.08]"
            style={{ fontSize: "clamp(32px, 5vw, 48px)" }}
          >
            Simple plans that grow with your team
          </h2>
        </Reveal>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {/* Free */}
          <Reveal index={0} className="flex">
            <div className="flex-1 p-8 border border-border rounded-2xl bg-card flex flex-col gap-6 transition-[border-color,box-shadow] duration-(--motion-base) ease-standard hover:border-primary/55 hover:shadow-card-hover">
              <div>
                <h3 className="text-base font-semibold leading-[normal]">Free</h3>
                <p className="mt-1.5 text-sm leading-[normal] text-muted-foreground">For trying Nudge on your own.</p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[44px] font-bold leading-[normal] tracking-[-0.03em]">$0</span>
                <span className="text-sm leading-[normal] text-muted-foreground">forever</span>
              </div>
              <ul className="flex flex-col gap-3 text-sm leading-[normal] text-dim flex-1">
                {["1 Slack workspace", "Up to 3 channels", "50 extracted tasks a month", "Morning digest"].map((item) => (
                  <li key={item} className="flex gap-[10px] items-center">
                    <CheckIcon />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="#waitlist"
                className="flex items-center justify-center h-12 rounded-[10px] border border-border bg-surface-elevated text-foreground text-sm font-semibold transition-colors duration-(--motion-fast) ease-standard hover:border-border-hover hover:bg-surface-hover"
              >
                Get started
              </Link>
            </div>
          </Reveal>

          {/* Pro — featured */}
          <Reveal index={1} className="flex">
            <div className="flex-1 relative p-8 border border-primary rounded-2xl bg-surface-featured flex flex-col gap-6 shadow-featured">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold leading-[normal]">Pro</h3>
                  <p className="mt-1.5 text-sm leading-[normal] text-muted-foreground">For people who live in Slack.</p>
                </div>
                <span className="px-[10px] py-1 rounded-full bg-primary/20 text-accent-lighter text-[12px] font-semibold leading-[normal] whitespace-nowrap">
                  Most popular
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[44px] font-bold leading-[normal] tracking-[-0.03em]">$12</span>
                <span className="text-sm leading-[normal] text-muted-foreground">per user / month</span>
              </div>
              <ul className="flex flex-col gap-3 text-sm leading-[normal] text-dim flex-1">
                {[
                  "Unlimited channels and DMs",
                  "Unlimited extracted tasks",
                  "Smart nudges before deadlines",
                  "Linear, Jira and Asana sync",
                ].map((item) => (
                  <li key={item} className="flex gap-[10px] items-center">
                    <CheckIcon />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="#waitlist"
                className="flex items-center justify-center h-[46px] rounded-[10px] bg-primary text-primary-foreground text-sm font-semibold transition-[filter,box-shadow] duration-(--motion-fast) ease-standard hover:brightness-[1.08] hover:shadow-glow-hover-sm"
              >
                Join waitlist
              </Link>
            </div>
          </Reveal>

          {/* Team */}
          <Reveal index={2} className="flex">
            <div className="flex-1 p-8 border border-border rounded-2xl bg-card flex flex-col gap-6 transition-[border-color,box-shadow] duration-(--motion-base) ease-standard hover:border-primary/55 hover:shadow-card-hover">
              <div>
                <h3 className="text-base font-semibold leading-[normal]">Team</h3>
                <p className="mt-1.5 text-sm leading-[normal] text-muted-foreground">For teams that ship together.</p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[44px] font-bold leading-[normal] tracking-[-0.03em]">$24</span>
                <span className="text-sm leading-[normal] text-muted-foreground">per user / month</span>
              </div>
              <ul className="flex flex-col gap-3 text-sm leading-[normal] text-dim flex-1">
                {[
                  "Everything in Pro",
                  "Shared team inbox",
                  "Admin controls and SSO",
                  "Priority support",
                ].map((item) => (
                  <li key={item} className="flex gap-[10px] items-center">
                    <CheckIcon />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="#waitlist"
                className="flex items-center justify-center h-12 rounded-[10px] border border-border bg-surface-elevated text-foreground text-sm font-semibold transition-colors duration-(--motion-fast) ease-standard hover:border-border-hover hover:bg-surface-hover"
              >
                Contact sales
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
