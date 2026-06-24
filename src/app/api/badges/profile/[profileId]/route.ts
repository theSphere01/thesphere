import { NextRequest, NextResponse } from "next/server";
import { hasSupabase, createAdminClient } from "@/lib/supabase/admin";
import { BADGE_DEFINITIONS } from "@/lib/constants";

// ── GET /api/badges/profile/[profileId] ───────────────────
// Returns earned badges for a profile
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const { profileId } = await params;

    if (!hasSupabase()) {
      // Mock: first 8 badges as earned
      const earned = BADGE_DEFINITIONS.slice(0, 8).map((b, i) => ({
        id: `pb-${i}`,
        profile_id: profileId,
        badge_id: b.id,
        earned_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        badge: b,
      }));
      return NextResponse.json({ data: earned });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("profile_badges")
      .select("*, badge:badge_definitions(*)")
      .eq("profile_id", profileId)
      .order("earned_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
