import FadeIn from "@/components/ui/FadeIn";
import WaitlistForm from "@/components/forms/WaitlistForm";

export default function Waitlist() {
  return (
    <section
      id="waitlist"
      className="relative px-5 py-[112px] border-y border-border bg-surface-deep overflow-hidden scroll-mt-20"
    >
      {/* Glow */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 w-[760px] max-w-[140%] h-[380px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(124,58,237,.22), rgba(124,58,237,0) 65%)",
        }}
      />

      <FadeIn className="relative max-w-[760px] mx-auto text-center flex flex-col items-center">
        <h2
          className="font-bold tracking-[-0.035em] leading-[1.04]"
          style={{ fontSize: "clamp(36px, 6.4vw, 64px)" }}
        >
          Stop chasing threads.
          <br />
          Start shipping.
        </h2>
        <p className="mt-5 max-w-[480px] text-base leading-relaxed text-muted-foreground">
          Join the waitlist and we&apos;ll invite your team as soon as a spot opens.
        </p>

        <WaitlistForm />

        <p className="mt-4 text-sm text-muted-foreground">
          No spam — we&apos;ll only email you when your invite is ready.
        </p>
      </FadeIn>
    </section>
  );
}
