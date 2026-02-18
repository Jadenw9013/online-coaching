import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? "Steadfast <notifications@steadfast.app>";

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping email send");
    return;
  }

  const resend = new Resend(apiKey);

  await resend.emails.send({ from, to: [to], subject, html, text });
}
