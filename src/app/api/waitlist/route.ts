import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { waitlistSchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (raw.length > 1024) {
    return NextResponse.json({ ok: false, error: "Request too large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const result = waitlistSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { ok: false, error: result.error.issues[0]?.message ?? "Invalid email" },
      { status: 400 }
    );
  }

  const { email, website } = result.data;

  // Honeypot filled: pretend success so bots don't retry
  if (website) {
    return NextResponse.json({ ok: true });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFICATION_EMAIL;
  const missing = [!apiKey && "RESEND_API_KEY", !to && "NOTIFICATION_EMAIL"].filter(Boolean);

  if (!apiKey || !to) {
    console.error(`Waitlist: missing env var(s): ${missing.join(", ")}`);
    return NextResponse.json(
      {
        ok: false,
        error: "The waitlist is temporarily unavailable. Please try again later.",
      },
      { status: 503 }
    );
  }

  const failure = NextResponse.json(
    { ok: false, error: "Could not join the waitlist. Please try again." },
    { status: 502 }
  );

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "Nudge AI <onboarding@resend.dev>",
      to,
      replyTo: email,
      subject: "New Nudge AI waitlist signup",
      text: `New signup\n\nEmail: ${email}\nTime: ${new Date().toUTCString()}`,
    });

    if (error) {
      console.error("Waitlist: Resend error", error);
      return failure;
    }
  } catch (err) {
    console.error("Waitlist: send failed", err);
    return failure;
  }

  return NextResponse.json({ ok: true });
}
