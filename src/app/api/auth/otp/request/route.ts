import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError } from "@/lib/auth/handle-error";
import { getParentLoginBundle, maskEmail, ParentLoginError } from "@/lib/auth/parent-login";
import { generateOtpCode, hashOtp } from "@/lib/auth/otp";
import { sendParentOtpEmail } from "@/lib/email/brevo-smtp";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ phone: z.string().min(8).max(32) });
const OTP_SEND_TIMEOUT_MS = 12_000;
const OTP_EXPIRES_MINUTES = 10;
const OTP_COOLDOWN_SECONDS = 60;

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

// POST /api/auth/otp/request
// The phone number identifies the parent record; the OTP is delivered to the
// email captured during registration for that same phone.
export async function POST(req: NextRequest) {
  try {
    const { phone } = schema.parse(await req.json());
    const { email, normalizedPhone, loginProfiles } = await getParentLoginBundle(phone);
    const supabase = createAdminClient();
    const now = new Date();
    const recentCutoff = new Date(now.getTime() - OTP_COOLDOWN_SECONDS * 1000).toISOString();

    const { data: recentOtp, error: recentError } = await supabase
      .from("phone_otps")
      .select("id")
      .eq("phone", normalizedPhone)
      .eq("consumed", false)
      .gt("created_at", recentCutoff)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentError) throw recentError;
    if (recentOtp) {
      return NextResponse.json(
        {
          error: "Please wait 60 seconds before requesting another code.",
          retry_after_seconds: OTP_COOLDOWN_SECONDS,
        },
        { status: 429 },
      );
    }

    await supabase
      .from("phone_otps")
      .update({ consumed: true })
      .eq("phone", normalizedPhone)
      .eq("consumed", false);

    const code = generateOtpCode();
    const expiresAt = new Date(now.getTime() + OTP_EXPIRES_MINUTES * 60 * 1000).toISOString();
    const { data: otpRow, error: insertError } = await supabase
      .from("phone_otps")
      .insert({
        phone: normalizedPhone,
        profile_id: loginProfiles[0]?.id ?? null,
        code_hash: hashOtp(code, normalizedPhone),
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    try {
      await withTimeout(sendParentOtpEmail({ to: email, code }));
    } catch (sendError) {
      if (otpRow?.id) {
        await supabase.from("phone_otps").update({ consumed: true }).eq("id", otpRow.id);
      }
      throw sendError;
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
