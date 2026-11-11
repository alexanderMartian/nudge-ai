"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { waitlistSchema, type WaitlistFormValues } from "@/lib/schemas";

const GENERIC_ERROR = "Something went wrong. Please try again.";

export default function WaitlistForm() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<WaitlistFormValues>({ resolver: zodResolver(waitlistSchema) });

  async function onSubmit(data: WaitlistFormValues) {
    clearErrors("root.server");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, website: data.website }),
      });
      const json: { ok?: boolean; error?: string } | null = await res
        .json()
        .catch(() => null);

      if (!res.ok || !json?.ok) {
        setError("root.server", { message: json?.error ?? GENERIC_ERROR });
        return;
      }
      setSent(true);
    } catch {
      setError("root.server", { message: GENERIC_ERROR });
    }
  }

  const serverError = errors.root?.server?.message;

  return (
    <>
      <div role="status">
        {sent && (
          <p className="mt-9 text-[15px] font-medium text-accent-light">
            You&apos;re on the list — we&apos;ll be in touch soon!
          </p>
        )}
      </div>

      {!sent && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-9 w-full max-w-[480px] flex flex-col sm:flex-row gap-[10px]"
          noValidate
        >
          {/* Honeypot — off-screen (not display:none, which many bots skip) */}
          <input
            type="text"
            tabIndex={-1}
            aria-hidden="true"
            autoComplete="off"
            className="absolute -left-[9999px]"
            {...register("website")}
          />

          <div className="flex-1 min-w-0">
            <label className="sr-only" htmlFor="waitlist-email">
              Work email
            </label>
            <input
              id="waitlist-email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "waitlist-email-error" : undefined}
              className="w-full h-[50px] px-4 border border-border rounded-xl bg-surface text-foreground text-[15px] placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,.25)] transition-[border-color,box-shadow]"
              {...register("email")}
            />
            {errors.email && (
              <p
                id="waitlist-email-error"
                role="alert"
                className="mt-1.5 text-[13px] text-destructive text-left"
              >
                {errors.email.message}
              </p>
            )}
            {serverError && (
              <p role="alert" className="mt-1.5 text-[13px] text-destructive text-left">
                {serverError}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-[50px] px-[22px] border-0 rounded-xl bg-primary text-primary-foreground text-[15px] font-semibold cursor-pointer whitespace-nowrap transition-[filter,box-shadow] hover:brightness-[1.08] hover:shadow-[0_0_28px_rgba(124,58,237,0.55)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Joining…" : "Join waitlist"}
          </button>
        </form>
      )}
    </>
  );
}
