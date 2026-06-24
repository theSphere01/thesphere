import { NextRequest, NextResponse } from "next/server";
import { hasSupabase, createAdminClient } from "@/lib/supabase/admin";
import { LANDS } from "@/lib/constants";

// ── GET /api/schedule?date=YYYY-MM-DD ──────────────────────
// Returns { lands: [{land_id, is_open}], stations: [{station_id, is_active}] }
export async function GET(req: NextRequest) {
  try {
    const date = req.nextUrl.searchParams.get("date");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Valid date parameter required (YYYY-MM-DD)" }, { status: 400 });
    }

    if (!hasSupabase()) {
      // Mock: all lands open, all stations active
      const lands = LANDS.map(l => ({ land_id: l.id, is_open: true }));
      const stations = LANDS.flatMap(l =>
        l.stations.map(s => ({ station_id: s.id, is_active: true }))
      );
      return NextResponse.json({ lands, stations, date });
    }

    const supabase = createAdminClient();
    const [{ data: landData }, { data: stationData }] = await Promise.all([
      supabase
        .from("daily_land_schedule")
        .select("land_id, is_open")
        .eq("schedule_date", date),
      supabase
        .from("daily_station_schedule")
        .select("station_id, is_active")
        .eq("schedule_date", date),
    ]);

    // For lands with no schedule row, default to open
    const allLandIds = LANDS.map(l => l.id);
    const scheduledLandIds = new Set((landData ?? []).map(r => r.land_id));
    const defaultOpen = allLandIds
      .filter(id => !scheduledLandIds.has(id))
      .map(id => ({ land_id: id, is_open: true }));

    return NextResponse.json({
      date,
      lands: [...(landData ?? []), ...defaultOpen],
      stations: stationData ?? [],
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
