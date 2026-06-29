import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError } from "@/lib/auth/handle-error";
import { getParentLoginBundle, ParentLoginError } from "@/lib/auth/parent-login";
import { createOtpAuthClient } from "@/lib/supabase/otp-auth";

const schema = z.object({
  phone: z.string().min(8).max(32),
  code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
});

// POST /api/auth/otp/verify
// Verifies the email OTP, then returns every camper profile linked to the
// verified parent phone/email pair.
export async function POST(req: NextRequest) {
  try {
    const { phone, code } = schema.parse(await req.json());
    const { email, loginProfiles } = await getParentLoginBundle(phone);
    const auth = createOtpAuthClient();

    const { error } = await auth.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (error) {
      return NextResponse.json({ error: "Incorrect or expired code." }, { status: 400 });
    }

    return NextResponse.json({
      data: {
        mode: "verified",
        profile: loginProfiles[0],
        profiles: loginProfiles,
      },
    });
  } catch (err) {
    if (err instanceof ParentLoginError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return handleRouteError(err);
  }
}
