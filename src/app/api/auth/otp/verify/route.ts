import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError } from "@/lib/auth/handle-error";
import { getParentLoginBundle, ParentLoginError } from "@/lib/auth/parent-login";
import { verifyOtpHash } from "@/lib/auth/otp";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  phone: z.string().min(8).max(32),
  code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
});
const MAX_OTP_ATTEMPTS = 5;

// POST /api/auth/otp/verify
// Verifies the email OTP, then returns every camper profile linked to the
// verified parent phone/email pair.
export async function POST(req: NextRequest) {
  try {
    const { phone, code } = schema.parse(await req.json());
    const { normalizedPhone, loginProfiles } = await getParentLoginBundle(phone);
    const supabase = createAdminClient();

    const { data: otp, error } = await supabase
      .from("phone_otps")
      .select("id, code_hash, attempts")
      .eq("phone", normalizedPhone)
      .eq("consumed", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!otp) {
      return NextResponse.json({ error: "Incorrect or expired code." }, { status: 400 });
    }

    const attempts = Number(otp.attempts ?? 0);
    const valid = verifyOtpHash(code, normalizedPhone, otp.code_hash);

    if (!valid) {
      const nextAttempts = attempts + 1;
      await supabase
        .from("phone_otps")
        .update({ attempts: nextAttempts, consumed: nextAttempts >= MAX_OTP_ATTEMPTS })
        .eq("id", otp.id);

      return NextResponse.json(
        {
          error: nextAttempts >= MAX_OTP_ATTEMPTS
            ? "Too many incorrect attempts. Request a new code."
            : "Incorrect or expired code.",
        },
        { status: 400 },
      );
    }

    await supabase
      .from("phone_otps")
      .update({ consumed: true, attempts: attempts + 1 })
      .eq("id", otp.id);

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
