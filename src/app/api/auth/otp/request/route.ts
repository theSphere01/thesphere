import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleRouteError } from "@/lib/auth/handle-error";

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
// OTP is disabled for now: find the parent profile by registered phone number
// and let the parent open it directly.
export async function POST(req: NextRequest) {
  try {
    const { phone } = schema.parse(await req.json());
    const normalized = phone.replace(/[\s\-()]/g, "");
    const supabase = createAdminClient();

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, name, total_points, avatar_url, current_streak, visit_count, lands_visited")
      .or(`parent_phone.eq.${normalized},parent_phone.eq.${phone}`)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!profile) {
      return NextResponse.json({ error: "No registered profile found for this phone number." }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        mode: "phone-only",
        profile: toLoginProfile(profile),
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
