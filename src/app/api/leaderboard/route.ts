import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// The public leaderboard reads from the `public_leaderboard` view, which
// exposes only a privacy-preserving display name (first name + last initial)
// and gamification stats — never full names, parent contact info, or exact
// visit timestamps (FIX #4: child-data exposure).
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") === "today" ? "today" : "season";

    const supabase = createAdminClient();

    if (type === "today") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { data: todaySessions } = await supabase
        .from("sessions")
        .select("profile_id, points_earned")
        .gte("check_in_at", todayStart.toISOString())
        .lte("check_in_at", todayEnd.toISOString());

      const todayProfileIds = [...new Set((todaySessions ?? []).map((s) => s.profile_id))];

      if (todayProfileIds.length === 0) {
        return NextResponse.json({ data: [] });
      }

      // Sum today's points per profile
      const todayPoints: Record<string, number> = {};
      for (const s of todaySessions ?? []) {
        todayPoints[s.profile_id] = (todayPoints[s.profile_id] ?? 0) + (s.points_earned ?? 0);
      }

      const { data: profiles } = await supabase
        .from("public_leaderboard")
        .select("profile_id, name, avatar_url, visit_count, lands_count, current_streak")
        .in("profile_id", todayProfileIds);

      const entries = (profiles ?? [])
        .map((p) => ({
          profile_id:     p.profile_id,
          name:           p.name,
          avatar_url:     p.avatar_url,
          total_points:   todayPoints[p.profile_id] ?? 0,
          visit_count:    p.visit_count,
          lands_count:    p.lands_count,
          current_streak: p.current_streak,
          rank:           0,
        }))
        .sort((a, b) => b.total_points - a.total_points)
        .map((e, i) => ({ ...e, rank: i + 1 }));

      return NextResponse.json({ data: entries });
    }

    // Season leaderboard
    const { data, error } = await supabase
      .from("public_leaderboard")
      .select("profile_id, name, avatar_url, total_points, visit_count, lands_count, current_streak")
      .order("total_points", { ascending: false })
      .limit(50);

    if (error) throw error;

    const entries = (data ?? []).map((p, i) => ({
      rank:           i + 1,
      profile_id:     p.profile_id,
      name:           p.name,
      avatar_url:     p.avatar_url,
      total_points:   p.total_points,
      visit_count:    p.visit_count,
      lands_count:    p.lands_count,
      current_streak: p.current_streak,
    }));

    return NextResponse.json({ data: entries });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch leaderboard";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
