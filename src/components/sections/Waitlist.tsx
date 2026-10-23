"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Please enter a valid work email"),
});

type FormValues = z.infer<typeof schema>;

export default function Waitlist() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(_data: FormValues) {
    await new Promise<void>((resolve) => setTimeout(resolve, 600));
    reset();
  }

  return (
    <section
      id="waitlist"
      className="relative px-5 py-[112px] border-y border-border bg-surface-deep overflow-hidden"
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

      <div className="relative max-w-[760px] mx-auto text-center flex flex-col items-center">
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

        {isSubmitSuccessful ? (
          <p className="mt-9 text-[15px] font-medium text-accent-light">
            You&apos;re on the list — we&apos;ll be in touch soon!
          </p>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-9 w-full max-w-[480px] flex flex-col sm:flex-row gap-[10px]"
            noValidate
          >
            <div className="flex-1 min-w-0">
              <label className="sr-only" htmlFor="waitlist-email">
                Work email
              </label>
              <input
                id="waitlist-email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                className="w-full h-[50px] px-4 border border-border rounded-xl bg-surface text-foreground text-[15px] placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,.25)] transition-all"
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1.5 text-[13px] text-destructive text-left">
                  {errors.email.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-[50px] px-[22px] border-0 rounded-xl bg-primary text-primary-foreground text-[15px] font-semibold cursor-pointer whitespace-nowrap transition-all hover:brightness-[1.08] hover:shadow-[0_0_28px_rgba(124,58,237,0.55)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Joining…" : "Join waitlist"}
            </button>
          </form>
        )}

        <p className="mt-4 text-[13px] text-muted-foreground">
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
