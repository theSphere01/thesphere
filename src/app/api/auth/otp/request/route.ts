import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError } from "@/lib/auth/handle-error";
import { getParentLoginBundle, maskEmail, ParentLoginError } from "@/lib/auth/parent-login";
import { createOtpAuthClient } from "@/lib/supabase/otp-auth";
import { getAppUrl } from "@/lib/app-url";

const schema = z.object({ phone: z.string().min(8).max(32) });

// POST /api/auth/otp/request
// The phone number identifies the parent record; the OTP is delivered to the
// email captured during registration for that same phone.
export async function POST(req: NextRequest) {
  try {
    const { phone } = schema.parse(await req.json());
    const { email, normalizedPhone } = await getParentLoginBundle(phone);
    const auth = createOtpAuthClient();

    const { error } = await auth.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: getAppUrl("/login"),
        data: {
          parent_phone: normalizedPhone,
          source: "sphere-parent-portal",
        },
      },
    });

    if (error) {
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
    if (err instanceof ParentLoginError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return handleRouteError(err);
  }
}
