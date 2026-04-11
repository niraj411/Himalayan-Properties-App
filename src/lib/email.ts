import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.EMAIL_FROM || "Himalayan Properties <noreply@himalayanproperties.com>";

export async function sendEmail({
  to,
  subject,
  body,
}: {
  to: string | string[];
  subject: string;
  body: string;
}) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn("Email not configured — SMTP_HOST or SMTP_USER missing");
    return;
  }

  await transporter.sendMail({
    from: FROM,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    text: body,
    html: body.replace(/\n/g, "<br>"),
  });
}

export async function sendTenantEmail({
  tenantName,
  tenantEmail,
  subject,
  body,
}: {
  tenantName: string;
  tenantEmail: string;
  subject: string;
  body: string;
}) {
  return sendEmail({ to: tenantEmail, subject, body: `Hi ${tenantName},\n\n${body}\n\n— Himalayan Properties` });
}
