import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleRouteError } from "@/lib/auth/handle-error";
import { generateOtpCode, hashOtp } from "@/lib/auth/otp";
import { getSmsProvider } from "@/lib/sms";

const schema = z.object({ phone: z.string().min(8).max(20) });

type LoginProfile = {
  id: string;
  name: string;
  total_points: number | null;
  avatar_url?: string | null;
  current_streak: number | null;
  visit_count: number | null;
  lands_visited?: string[] | null;
};

function toLoginProfile(profile: LoginProfile) {
  return {
    id: profile.id,
    name: profile.name,
    total_points: profile.total_points ?? 0,
    avatar_url: profile.avatar_url ?? undefined,
    current_streak: profile.current_streak ?? 0,
    visit_count: profile.visit_count ?? 0,
    lands_count: (profile.lands_visited ?? []).length,
  };
}

// ── POST /api/auth/otp/request ─────────────────────────────
// Sends a one-time code to the parent's phone IF a profile exists for it.
// Until a real SMS gateway is configured, falls back to phone-only matching so
// the parent portal remains usable during rollout.
export async function POST(req: NextRequest) {
  try {
    const { phone } = schema.parse(await req.json());
    const normalized = phone.replace(/[\s\-()]/g, "");
    const supabase = createAdminClient();
    const smsProvider = getSmsProvider();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .or(`parent_phone.eq.${normalized},parent_phone.eq.${phone}`)
      .limit(1)
      .single();

    if (profile) {
      if (smsProvider.name === "console" || !smsProvider.isConfigured()) {
        const { data: loginProfile } = await supabase
          .from("profiles")
          .select("id, name, total_points, avatar_url, current_streak, visit_count, lands_visited")
          .eq("id", profile.id)
          .single();

        if (loginProfile) {
          return NextResponse.json({
            data: {
              mode: "phone-only",
              profile: toLoginProfile(loginProfile),
            },
          });
        }
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
      await smsProvider.send(normalized, `The Sphere verification code: ${code} (valid for 5 minutes)`);
    }

    return NextResponse.json({ data: { sent: true, mode: "sms" } });
  } catch (err) {
    return handleRouteError(err);
  }
}
