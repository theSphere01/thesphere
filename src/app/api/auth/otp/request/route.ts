import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError } from "@/lib/auth/handle-error";
import { getParentLoginBundle, maskEmail, ParentLoginError } from "@/lib/auth/parent-login";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOtpAuthClient } from "@/lib/supabase/otp-auth";
import { getAppUrl } from "@/lib/app-url";

const schema = z.object({ phone: z.string().min(8).max(32) });
const OTP_SEND_TIMEOUT_MS = 12_000;

function isRateLimitError(error: { message?: string; status?: number; code?: string }) {
  const message = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();
  return error.status === 429 || code.includes("rate") || message.includes("rate limit") || message.includes("too many");
}

function isTimeoutError(error: { message?: string; status?: number; code?: string }) {
  const message = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();
  return (
    error.status === 504 ||
    code.includes("timeout") ||
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("context deadline")
  );
}

function isAlreadyRegisteredError(error: { message?: string; status?: number }) {
  const message = (error.message ?? "").toLowerCase();
  return (
    message.includes("already") ||
    message.includes("registered") ||
    message.includes("exists") ||
    message.includes("duplicate")
  );
}

class OtpSendTimeoutError extends Error {
  status = 504;
  code = "otp_send_timeout";

  constructor() {
    super("Email service timed out while sending the verification code.");
    this.name = "OtpSendTimeoutError";
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = OTP_SEND_TIMEOUT_MS): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const timer = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new OtpSendTimeoutError()), timeoutMs);
  });

  return Promise.race([promise, timer]).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
}

function timeoutResponse() {
  return NextResponse.json(
    {
      error: "Email service is taking too long. Please check SMTP settings or try again in a minute.",
      retry_after_seconds: 60,
    },
    { status: 504 },
  );
}

async function ensureOtpAuthUser(email: string, normalizedPhone: string) {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      parent_phone: normalizedPhone,
      source: "sphere-parent-portal",
    },
  });

  if (error && !isAlreadyRegisteredError(error)) {
    throw error;
  }
}

// POST /api/auth/otp/request
// The phone number identifies the parent record; the OTP is delivered to the
// email captured during registration for that same phone.
export async function POST(req: NextRequest) {
  try {
    const { phone } = schema.parse(await req.json());
    const { email, normalizedPhone } = await getParentLoginBundle(phone);
    await ensureOtpAuthUser(email, normalizedPhone);
    const auth = createOtpAuthClient();

    const { error } = await withTimeout(auth.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: getAppUrl("/login", req.nextUrl.origin),
        data: {
          parent_phone: normalizedPhone,
          source: "sphere-parent-portal",
        },
      },
    }));

    if (error) {
      if (isRateLimitError(error)) {
        return NextResponse.json(
          {
            error: "Email sending is temporarily limited. Please wait 60 seconds before requesting another code.",
            retry_after_seconds: 60,
          },
          { status: 429 },
        );
      }

      if (isTimeoutError(error)) {
        return timeoutResponse();
      }

      return NextResponse.json(
        { error: error.message || "Could not send verification code." },
        { status: error.status || 500 },
      );
    }

    return NextResponse.json({
      data: {
        mode: "email",
        sent: true,
        destination: maskEmail(email),
      },
    });
  } catch (err) {
    if (err instanceof OtpSendTimeoutError) {
      return timeoutResponse();
    }
    if (err instanceof ParentLoginError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return handleRouteError(err);
  }
}
