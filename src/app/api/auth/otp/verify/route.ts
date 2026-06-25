import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleRouteError } from "@/lib/auth/handle-error";
import { verifyOtpHash } from "@/lib/auth/otp";

const schema = z.object({
  phone: z.string().regex(/^\+?[0-9]{8,15}$/, "Invalid phone number"),
  code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
});

// ── POST /api/auth/otp/verify ──────────────────────────────
// Verifies the code and, on success, returns the camper profile so the
// parent portal can open it. Codes are single-use, expire in 5 minutes,
// and lock after 5 failed attempts.
export async function POST(req: NextRequest) {
  try {
    const { phone, code } = schema.parse(await req.json());
    const normalized = phone.replace(/[\s\-()]/g, "");
    const supabase = createAdminClient();

    const { data: otp } = await supabase
      .from("phone_otps")
      .select("*")
      .eq("phone", normalized)
      .eq("consumed", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!otp) {
      return NextResponse.json({ error: "Code expired or invalid. Request a new one." }, { status: 400 });
    }
    if (otp.attempts >= 5) {
      await supabase.from("phone_otps").update({ consumed: true }).eq("id", otp.id);
      return NextResponse.json({ error: "Too many attempts. Request a new code." }, { status: 429 });
    }
    if (!verifyOtpHash(code, normalized, otp.code_hash)) {
      await supabase.from("phone_otps").update({ attempts: otp.attempts + 1 }).eq("id", otp.id);
      return NextResponse.json({ error: "Incorrect code." }, { status: 400 });
    }

    await supabase.from("phone_otps").update({ consumed: true }).eq("id", otp.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, name, total_points, avatar_url, current_streak, visit_count, lands_visited")
      .eq("id", otp.profile_id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: profile.id,
        name: profile.name,
        total_points: profile.total_points,
        avatar_url: profile.avatar_url,
        current_streak: profile.current_streak,
        visit_count: profile.visit_count,
        lands_count: (profile.lands_visited ?? []).length,
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
