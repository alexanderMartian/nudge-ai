import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { waitlistSchema } from "@/lib/schemas";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const body = await req.json();

  const result = waitlistSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { ok: false, error: result.error.issues[0]?.message ?? "Invalid email" },
      { status: 400 }
    );
  }

  const { email } = result.data;
  const to = process.env.NOTIFICATION_EMAIL;

  if (!to) {
    return NextResponse.json(
      { ok: false, error: "Server misconfiguration" },
      { status: 500 }
    );
  }

  const { error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to,
    subject: "New Nudge AI waitlist signup",
    text: `New signup\n\nEmail: ${email}\nTime: ${new Date().toUTCString()}`,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
