import "server-only";

const BREVO_SEND_EMAIL_URL = "https://api.brevo.com/v3/smtp/email";
const EMAIL_TIMEOUT_MS = 12_000;

type SendOtpEmailInput = {
  to: string;
  code: string;
};

type Sender = {
  name: string;
  email: string;
};

export class BrevoEmailError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "BrevoEmailError";
  }
}

function parseSender(value: string | undefined): Sender | null {
  if (!value) return null;

  const trimmed = value.trim();
  const bracketMatch = trimmed.match(/^(.*?)<([^<>@\s]+@[^<>@\s]+)>$/);
  if (bracketMatch) {
    return {
      name: bracketMatch[1].replaceAll('"', "").trim() || "The Sphere",
      email: bracketMatch[2].trim(),
    };
  }

  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
    return { name: "The Sphere", email: trimmed };
  }

  return null;
}

function getBrevoConfig() {
  const apiKey = process.env.BREVO_API_KEY;
  const sender = process.env.BREVO_SENDER_EMAIL
    ? {
        name: process.env.BREVO_SENDER_NAME || "The Sphere",
        email: process.env.BREVO_SENDER_EMAIL,
      }
    : parseSender(process.env.OTP_EMAIL_FROM);

  if (!apiKey) {
    throw new Error("Brevo API key is not configured");
  }

  if (!sender) {
    throw new Error("Brevo sender email is not configured");
  }

  return { apiKey, sender };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildOtpEmail(code: string) {
  const safeCode = escapeHtml(code);
  return {
    subject: "Your The Sphere login code",
    textContent: `Your The Sphere login code is ${code}. It expires in 10 minutes.`,
    htmlContent: `
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
  };
}

export async function sendParentOtpEmail({ to, code }: SendOtpEmailInput) {
  const config = getBrevoConfig();
  const email = buildOtpEmail(code);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EMAIL_TIMEOUT_MS);

  try {
    const response = await fetch(BREVO_SEND_EMAIL_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": config.apiKey,
      },
      body: JSON.stringify({
        sender: config.sender,
        to: [{ email: to }],
        subject: email.subject,
        textContent: email.textContent,
        htmlContent: email.htmlContent,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new BrevoEmailError(body || `Brevo email API failed with ${response.status}`, response.status);
    }
  } finally {
    clearTimeout(timeout);
  }
}
