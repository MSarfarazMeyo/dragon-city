import nodemailer from "nodemailer";

// No-op until SMTP_* env vars exist (see .env.local.example) — same
// pattern as the Supabase env guard in proxy.ts, so nothing breaks
// before this is configured. Uses plain SMTP (e.g. the same Gmail app
// password already set up for Supabase Auth emails) rather than a
// separate provider, since no Resend/SendGrid account exists yet.
export async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.log(`[email:skipped, SMTP not configured] to=${to} subject="${subject}"`);
    return false;
  }

  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transport.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to,
    subject,
    text: body,
  });

  return true;
}
