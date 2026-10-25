import FadeIn from "@/components/ui/FadeIn";

const features = [
  {
    title: "Reads every channel",
    description: "Spots the asks hiding in threads, DMs and busy channels.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 9h14M5 15h14M10 4L8 20M16 4l-2 16" />
      </svg>
    ),
  },
  {
    title: "Tasks, not noise",
    description: "Every request becomes a card with an owner and a due date.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M8.5 12l2.5 2.5 4.5-5" />
      </svg>
    ),
  },
  {
    title: "Gentle nudges",
    description: "A quiet reminder in Slack right before something slips.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15z" />
        <path d="M10 20.5a2 2 0 004 0" />
      </svg>
    ),
  },
  {
    title: "Syncs with your tracker",
    description: "Push tasks to Linear, Jira or Asana in one click.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 12a8 8 0 0113.7-5.6L20 8" />
        <path d="M20 4v4h-4" />
        <path d="M20 12a8 8 0 01-13.7 5.6L4 16" />
        <path d="M4 20v-4h4" />
      </svg>
    ),
  },
  {
    title: "Morning digest",
    description: "One summary of what you owe — and what you're owed.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    ),
  },
  {
    title: "Private by default",
    description: "Nudge only reads the channels you choose to connect.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" />
        <path d="M9.5 12l2 2 3.5-4" />
      </svg>
    ),
  },
] as const;

export default function Features() {
  return (
    <section id="features" className="px-5 py-[104px] scroll-mt-20">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <FadeIn className="max-w-[640px] mx-auto mb-14 text-center">
          <p className="mb-3 text-[13px] font-semibold tracking-[.08em] uppercase text-accent-light">
            Features
          </p>
          <h2
            className="font-bold tracking-[-0.03em] leading-[1.08]"
            style={{ fontSize: "clamp(32px, 5vw, 48px)" }}
          >
            Everything your team said it would do, in one place
          </h2>
        </FadeIn>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <FadeIn
              key={feature.title}
              delay={i * 0.08}
              className="p-7 min-h-[200px] border border-border rounded-2xl bg-card flex flex-col justify-between gap-8 transition-all duration-200 hover:border-[rgba(124,58,237,0.55)] hover:shadow-[0_0_0_1px_rgba(124,58,237,.18),_0_0_48px_-12px_rgba(124,58,237,.55)]"
            >
              <span className="w-10 h-10 rounded-[10px] border border-[#2A2A3E] bg-surface-elevated text-accent-lighter inline-flex items-center justify-center">
                {feature.icon}
              </span>
              <div>
                <h3 className="mb-2 text-[18px] font-semibold tracking-[-0.01em]">
                  {feature.title}
                </h3>
                <p className="text-[15px] leading-[1.5] text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
