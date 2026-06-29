import "server-only";

import nodemailer from "nodemailer";

const DEFAULT_SMTP_HOST = "smtp-relay.brevo.com";
const DEFAULT_SMTP_PORT = 587;
const EMAIL_TIMEOUT_MS = 12_000;

type SendOtpEmailInput = {
  to: string;
  code: string;
};

function getSmtpConfig() {
  const host = process.env.BREVO_SMTP_HOST || DEFAULT_SMTP_HOST;
  const port = Number(process.env.BREVO_SMTP_PORT || DEFAULT_SMTP_PORT);
  const user = process.env.BREVO_SMTP_USER;
  const pass = process.env.BREVO_SMTP_PASS;
  const from = process.env.OTP_EMAIL_FROM || (user ? `The Sphere <${user}>` : "");

  if (!user || !pass || !from) {
    throw new Error("Brevo SMTP is not configured");
  }

  return { host, port, user, pass, from };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendParentOtpEmail({ to, code }: SendOtpEmailInput) {
  const config = getSmtpConfig();
  const safeCode = escapeHtml(code);

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    connectionTimeout: EMAIL_TIMEOUT_MS,
    greetingTimeout: EMAIL_TIMEOUT_MS,
    socketTimeout: EMAIL_TIMEOUT_MS,
  });

  await transporter.sendMail({
    from: config.from,
    to,
    subject: "Your The Sphere login code",
    text: `Your The Sphere login code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="margin:0;padding:32px;background:#151426;font-family:Arial,sans-serif;color:#ffffff;">
        <div style="max-width:520px;margin:0 auto;background:#211f34;border:1px solid rgba(255,255,255,0.12);border-radius:18px;padding:28px;">
          <p style="margin:0 0 10px;color:#ff7a45;font-size:13px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">The Sphere</p>
          <h1 style="margin:0 0 14px;font-size:28px;line-height:1.15;color:#ffffff;">Your login code</h1>
          <p style="margin:0 0 22px;color:#c6c1d9;font-size:15px;line-height:1.6;">Use this 6-digit code to open your parent profile.</p>
          <div style="margin:0 0 22px;padding:18px 20px;background:#171527;border-radius:14px;text-align:center;font-size:34px;font-weight:800;letter-spacing:0.32em;color:#f3ba4d;">${safeCode}</div>
          <p style="margin:0;color:#918aa8;font-size:13px;line-height:1.6;">This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
        </div>
      </div>
    `,
  });
}
