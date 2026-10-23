"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

export default function Hero() {
  const reduced = useReducedMotion();

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: reduced ? 0 : 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section id="top" className="relative overflow-hidden px-5 pt-20 pb-10">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[380px] w-[900px] max-w-[120%] h-[520px] -translate-x-1/2 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(124,58,237,.28), rgba(124,58,237,0) 65%)",
        }}
      />

      <div className="relative max-w-[1200px] mx-auto flex flex-col items-center text-center">
        {/* Beta pill */}
        <motion.div {...fadeUp(0.1)}>
          <Link
            href="#changelog"
            className="inline-flex items-center gap-2 border border-border rounded-full bg-surface text-[13px] text-subtle"
            style={{ padding: "6px 12px 6px 6px" }}
          >
            <span
              className="px-2 py-0.5 rounded-full text-accent-lighter font-semibold text-[12px]"
              style={{ background: "rgba(124,58,237,.18)" }}
            >
              Beta
            </span>
            <span>Now in private beta for Slack teams</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
        </motion.div>

        {/* Headline */}
        <motion.h1
          {...fadeUp(0.2)}
          className="mt-7 max-w-[940px] font-bold tracking-[-0.035em] leading-[1.04]"
          style={{ fontSize: "clamp(40px, 7.4vw, 72px)" }}
        >
          Your Slack is full of tasks.
          <br />
          <span className="text-accent-light">Nudge finds them.</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          {...fadeUp(0.3)}
          className="mt-6 max-w-[560px] text-base leading-relaxed text-muted-foreground"
        >
          Nudge AI reads the conversations your team already has, pulls out every
          request and promise, and turns them into tasks — so nothing gets lost
          in a thread.
        </motion.p>

        {/* CTAs */}
        <motion.div {...fadeUp(0.4)} className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            href="#waitlist"
            className="inline-flex items-center gap-2 h-12 px-[22px] rounded-xl bg-primary text-primary-foreground text-[15px] font-semibold shadow-[0_0_24px_rgba(124,58,237,.35)] transition-all hover:brightness-[1.08] hover:shadow-[0_0_28px_rgba(124,58,237,0.55)]"
          >
            Join the waitlist
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </Link>
          <Link
            href="#features"
            className="inline-flex items-center gap-2 h-12 px-[22px] rounded-xl border border-border bg-surface text-foreground text-[15px] font-medium transition-all hover:border-[#3A3A55] hover:bg-surface-elevated"
          >
            See how it works
          </Link>
        </motion.div>

        {/* Inbox mockup */}
        <motion.div
          {...fadeUp(0.5)}
          className="mt-[72px] w-full max-w-[1080px] border border-[#262638] rounded-2xl bg-surface-deep overflow-hidden text-left shadow-[0_0_0_1px_rgba(124,58,237,.12),_0_40px_120px_-30px_rgba(124,58,237,.45)]"
        >
          {/* Mockup chrome */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-surface">
            <div className="flex items-center gap-[10px] min-w-0">
              <span className="w-5 h-5 shrink-0 rounded-md bg-primary inline-flex items-center justify-center">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h10" />
                  <path d="M11 6l6 6-6 6" />
                </svg>
              </span>
              <span className="text-[13px] font-semibold">Inbox</span>
              <span className="text-[12px] text-subtle whitespace-nowrap">Acme workspace</span>
            </div>
            <div className="flex items-center gap-2 px-[10px] py-[5px] border border-border rounded-lg bg-background text-[12px] text-subtle">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="6" />
                <path d="M20 20l-4.5-4.5" />
              </svg>
              <span>Search tasks</span>
              <span className="font-mono text-[11px] px-[5px] py-px border border-border rounded">⌘K</span>
            </div>
          </div>

          {/* Two-panel grid */}
          <div className="grid md:grid-cols-2">
            {/* Left: Slack messages */}
            <div className="p-5 border-r border-border flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold tracking-[.06em] uppercase text-subtle">
                  From Slack
                </span>
                <span className="text-[12px] text-subtle">3 messages</span>
              </div>

              <MockMessage
                initials="MC"
                name="Maya Chen"
                channel="#launch-q4 · 10:42"
                before="@Sam can you "
                highlight="send the updated pricing deck to legal by Thursday"
                after="?"
              />
              <MockMessage
                initials="LP"
                name="Leo Park"
                channel="#design · 11:05"
                before="Looks good. I'll "
                highlight="review the onboarding flow before Friday's sync"
                after="."
              />
              <MockMessage
                initials="PS"
                name="Priya Shah"
                channel="Direct message · 11:31"
                before="Don't forget we promised Northwind a "
                highlight="follow-up on the SSO issue this week"
                after="."
              />
            </div>

            {/* Right: Extracted tasks */}
            <div className="p-5 flex flex-col gap-3 bg-mockup-panel">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold tracking-[.06em] uppercase text-accent-lighter">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
                  </svg>
                  Extracted tasks
                </span>
                <span className="text-[12px] text-subtle">Just now</span>
              </div>

              {/* Highlighted task */}
              <div
                className="p-[14px] rounded-xl bg-surface flex flex-col gap-[10px] shadow-[0_0_30px_-10px_rgba(124,58,237,.6)]"
                style={{ border: "1px solid rgba(124,58,237,.5)" }}
              >
                <div className="flex items-start gap-[10px]">
                  <span className="w-[18px] h-[18px] shrink-0 mt-px border border-checkbox-border rounded-md" />
                  <span className="text-sm font-medium leading-[1.4]">
                    Send updated pricing deck to legal
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pl-7 text-[12px]">
                  <span className="px-2 py-[3px] rounded-md bg-tag-bg text-dim">@Sam</span>
                  <span className="px-2 py-[3px] rounded-md text-warn-text" style={{ background: "rgba(251,146,60,.14)" }}>Due Thu</span>
                  <span className="px-2 py-[3px] rounded-md bg-tag-bg text-subtle">#launch-q4</span>
                </div>
              </div>

              <MockTask
                label="Review onboarding flow"
                tags={[
                  { text: "@Leo", variant: "dim" },
                  { text: "Due Fri", variant: "dim" },
                  { text: "#design", variant: "subtle" },
                ]}
              />
              <MockTask
                label="Follow up with Northwind on SSO"
                tags={[
                  { text: "@You", variant: "dim" },
                  { text: "This week", variant: "dim" },
                  { text: "DM · Priya", variant: "subtle" },
                ]}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function MockMessage({
  initials,
  name,
  channel,
  before,
  highlight,
  after,
}: {
  initials: string;
  name: string;
  channel: string;
  before: string;
  highlight: string;
  after: string;
}) {
  return (
    <div className="p-[14px] border border-border rounded-xl bg-surface flex gap-3">
      <span className="w-8 h-8 shrink-0 rounded-lg bg-avatar-bg text-[#E5E7EB] text-[12px] font-semibold inline-flex items-center justify-center">
        {initials}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-1.5 text-[13px]">
          <strong className="font-semibold">{name}</strong>
          <span className="text-subtle text-[12px]">{channel}</span>
        </div>
        <p className="mt-1 text-sm leading-[1.5] text-dim">
          {before}
          <span
            className="text-foreground border-b border-accent-light px-0.5"
            style={{ background: "rgba(124,58,237,.22)" }}
          >
            {highlight}
          </span>
          {after}
        </p>
      </div>
    </div>
  );
}

function MockTask({
  label,
  tags,
}: {
  label: string;
  tags: { text: string; variant: "dim" | "subtle" }[];
}) {
  return (
    <div className="p-[14px] border border-border rounded-xl bg-surface flex flex-col gap-[10px]">
      <div className="flex items-start gap-[10px]">
        <span className="w-[18px] h-[18px] shrink-0 mt-px border border-checkbox-border rounded-md" />
        <span className="text-sm font-medium leading-[1.4]">{label}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 pl-7 text-[12px]">
        {tags.map((tag) => (
          <span
            key={tag.text}
            className={`px-2 py-[3px] rounded-md bg-tag-bg ${tag.variant === "dim" ? "text-dim" : "text-subtle"}`}
          >
            {tag.text}
          </span>
        ))}
      </div>
    </div>
  );
}
