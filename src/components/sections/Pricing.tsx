import Link from "next/link";
import FadeIn from "@/components/ui/FadeIn";

const CheckIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#A78BFA"
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
    <section id="pricing" className="px-5 pt-10 pb-[104px] scroll-mt-[68px]">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <FadeIn className="max-w-[640px] mx-auto mb-14 text-center">
          <p className="mb-3 text-[13px] font-semibold tracking-[.08em] uppercase text-accent-light">
            Pricing
          </p>
          <h2
            className="font-bold tracking-[-0.03em] leading-[1.08]"
            style={{ fontSize: "clamp(32px, 5vw, 48px)" }}
          >
            Simple plans that grow with your team
          </h2>
        </FadeIn>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {/* Free */}
          <FadeIn delay={0} className="p-8 border border-border rounded-2xl bg-card flex flex-col gap-6 transition-all duration-200 hover:border-[rgba(124,58,237,0.55)] hover:shadow-[0_0_0_1px_rgba(124,58,237,.18),_0_0_48px_-12px_rgba(124,58,237,.55)]">
            <div>
              <h3 className="text-base font-semibold">Free</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">For trying Nudge on your own.</p>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[44px] font-bold tracking-[-0.03em]">$0</span>
              <span className="text-sm text-muted-foreground">forever</span>
            </div>
            <ul className="flex flex-col gap-3 text-sm text-dim flex-1">
              {["1 Slack workspace", "Up to 3 channels", "50 extracted tasks a month", "Morning digest"].map((item) => (
                <li key={item} className="flex gap-[10px] items-center">
                  <CheckIcon />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="#waitlist"
              className="flex items-center justify-center h-[46px] rounded-[10px] border border-border bg-surface-elevated text-foreground text-sm font-semibold transition-all hover:border-[#3A3A55] hover:bg-[#1A1A27]"
            >
              Get started
            </Link>
          </FadeIn>

          {/* Pro — featured */}
          <FadeIn
            delay={0.08}
            className="relative p-8 rounded-2xl bg-[#13111D] flex flex-col gap-6 shadow-[0_0_0_1px_rgba(124,58,237,.25),_0_24px_80px_-24px_rgba(124,58,237,.55)]"
            style={{ border: "1px solid #7C3AED" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">Pro</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">For people who live in Slack.</p>
              </div>
              <span
                className="px-[10px] py-1 rounded-full text-accent-lighter text-[12px] font-semibold whitespace-nowrap"
                style={{ background: "rgba(124,58,237,.2)" }}
              >
                Most popular
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[44px] font-bold tracking-[-0.03em]">$12</span>
              <span className="text-sm text-muted-foreground">per user / month</span>
            </div>
            <ul className="flex flex-col gap-3 text-sm text-dim flex-1">
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
              className="flex items-center justify-center h-[46px] rounded-[10px] bg-primary text-primary-foreground text-sm font-semibold transition-all hover:brightness-[1.08] hover:shadow-[0_0_24px_rgba(124,58,237,.45)]"
            >
              Join waitlist
            </Link>
          </FadeIn>

          {/* Team */}
          <FadeIn delay={0.16} className="p-8 border border-border rounded-2xl bg-card flex flex-col gap-6 transition-all duration-200 hover:border-[rgba(124,58,237,0.55)] hover:shadow-[0_0_0_1px_rgba(124,58,237,.18),_0_0_48px_-12px_rgba(124,58,237,.55)]">
            <div>
              <h3 className="text-base font-semibold">Team</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">For teams that ship together.</p>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[44px] font-bold tracking-[-0.03em]">$24</span>
              <span className="text-sm text-muted-foreground">per user / month</span>
            </div>
            <ul className="flex flex-col gap-3 text-sm text-dim flex-1">
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
              className="flex items-center justify-center h-[46px] rounded-[10px] border border-border bg-surface-elevated text-foreground text-sm font-semibold transition-all hover:border-[#3A3A55] hover:bg-[#1A1A27]"
            >
              Contact sales
            </Link>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
