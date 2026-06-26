import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const [profileRes, badgesRes, codesRes, leaderboardRes, wristbandRes] = await Promise.all([
      // Public profile page is addressable by UUID — never return parent PII here.
      supabase
        .from("profiles")
        .select("id, name, age, avatar_url, total_points, season_points, visit_count, current_streak, lands_visited, last_visit_date, created_at")
        .eq("id", id)
        .single(),
      supabase
        .from("profile_badges")
        .select("*, badge:badge_definitions(*)")
        .eq("profile_id", id)
        .order("earned_at", { ascending: false }),
      supabase
        .from("discount_codes")
        .select("*")
        .eq("profile_id", id)
        .eq("is_used", false)
        .gte("valid_until", new Date().toISOString()),
      supabase
        .from("profiles")
        .select("id, total_points")
        .order("total_points", { ascending: false })
        .limit(200),
      // The signed wristband token, so the profile page can re-display the QR
      // for staff to scan at the gate (its own UUID gates access).
      supabase
        .from("wristbands")
        .select("qr_code")
        .eq("profile_id", id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle(),
    ]);

    if (profileRes.error) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const allProfiles = leaderboardRes.data ?? [];
    const rankIndex = allProfiles.findIndex((p) => p.id === id);
    const rank = rankIndex >= 0 ? rankIndex + 1 : undefined;

    return NextResponse.json({
      data: {
        profile:       profileRes.data,
        badges:        badgesRes.data ?? [],
        discount_codes: codesRes.data ?? [],
        wristband_qr:  wristbandRes.data?.qr_code ?? null,
        rank,
      },
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
