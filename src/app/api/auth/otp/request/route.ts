import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleRouteError } from "@/lib/auth/handle-error";
import { generateOtpCode, hashOtp } from "@/lib/auth/otp";
import { getSmsProvider } from "@/lib/sms";

const schema = z.object({ phone: z.string().regex(/^\+?[0-9]{8,15}$/, "Invalid phone number") });

// Don't send another code if one was issued for this phone within this window.
const RESEND_COOLDOWN_MS = 45 * 1000;

// ── POST /api/auth/otp/request ─────────────────────────────
// Sends a one-time code to the parent's phone IF a profile exists for it.
// The response is always generic so it can't be used to enumerate who is
// registered (anti-enumeration).
export async function POST(req: NextRequest) {
  try {
    const { phone } = schema.parse(await req.json());
    const normalized = phone.replace(/[\s\-()]/g, "");
    const supabase = createAdminClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .or(`parent_phone.eq.${normalized},parent_phone.eq.${phone}`)
      .limit(1)
      .single();

    if (profile) {
      // Rate limit: skip if a code was already issued recently (anti SMS-bombing).
      // Response stays generic so it can't be used to probe timing either.
      const { data: recent } = await supabase
        .from("phone_otps")
        .select("created_at")
        .eq("phone", normalized)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (recent && Date.now() - new Date(recent.created_at).getTime() < RESEND_COOLDOWN_MS) {
        return NextResponse.json({ data: { sent: true } });
      }

      const code = generateOtpCode();
      // invalidate any previous unused codes for this phone
      await supabase.from("phone_otps").update({ consumed: true }).eq("phone", normalized).eq("consumed", false);
      await supabase.from("phone_otps").insert({
        phone: normalized,
        profile_id: profile.id,
        code_hash: hashOtp(code, normalized),
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });
      await getSmsProvider().send(normalized, `The Sphere verification code: ${code} (valid for 5 minutes)`);
    }

    return NextResponse.json({ data: { sent: true } });
  } catch (err) {
    return handleRouteError(err);
  }
}
