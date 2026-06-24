import { NextRequest, NextResponse } from "next/server";
import { hasSupabase, createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/guards";
import { handleRouteError } from "@/lib/auth/handle-error";
import type { Profile } from "@/lib/types";

const MOCK_PROFILES: Profile[] = [
  {
    id: "profile-001",
    name: "Omar Hassan",
    age: 12,
    total_points: 4850,
    season_points: 4850,
    visit_count: 8,
    current_streak: 3,
    lands_visited: ["land-art", "land-cooking", "land-science", "land-sports", "land-vr", "land-lego"],
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "profile-002",
    name: "Layla Ahmed",
    age: 10,
    total_points: 4200,
    season_points: 4200,
    visit_count: 7,
    current_streak: 2,
    lands_visited: ["land-fashion", "land-beauty", "land-handmade", "land-cooking", "land-gardening"],
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "profile-003",
    name: "Karim Mostafa",
    age: 14,
    total_points: 3750,
    season_points: 3750,
    visit_count: 6,
    current_streak: 1,
    lands_visited: ["land-lego", "land-vr", "land-science", "land-sports", "land-nilco", "land-art", "land-cooking"],
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ── GET /api/profiles?search= ─────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await requireStaff();
    const search = req.nextUrl.searchParams.get("search");

    if (!hasSupabase()) {
      let results = MOCK_PROFILES;
      if (search) {
        const q = search.toLowerCase();
        results = MOCK_PROFILES.filter(
          p => p.name.toLowerCase().includes(q) || (p.parent_name ?? "").toLowerCase().includes(q)
        );
      }
      return NextResponse.json({ data: results });
    }

    const supabase = createAdminClient();
    let query = supabase
      .from("profiles")
      .select("id, name, age, avatar_url, total_points, visit_count, current_streak, created_at")
      .order("total_points", { ascending: false })
      .limit(50);

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err) {
    return handleRouteError(err);
  }
}
