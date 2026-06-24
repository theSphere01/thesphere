import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/guards";
import { handleRouteError } from "@/lib/auth/handle-error";
import { LANDS } from "@/lib/constants";

const SaveScheduleSchema = z.object({
  schedule_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  open_land_ids: z.array(z.string()),
  active_station_ids: z.array(z.string()),
});

// ── POST /api/schedule/save ────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const parsed = SaveScheduleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const { schedule_date, open_land_ids, active_station_ids } = parsed.data;
    const supabase = createAdminClient();

    // Upsert land schedules for all 11 lands
    const landUpserts = LANDS.map(land => ({
      schedule_date,
      land_id: land.id,
      is_open: open_land_ids.includes(land.id),
    }));

    const { error: landError } = await supabase
      .from("daily_land_schedule")
      .upsert(landUpserts, { onConflict: "schedule_date,land_id" });

    if (landError) return NextResponse.json({ error: landError.message }, { status: 500 });

    // Upsert station schedules for all stations across all lands
    const allStations = LANDS.flatMap(land => land.stations.map(s => ({
      schedule_date,
      station_id: s.id,
      is_active: active_station_ids.includes(s.id),
    })));

    const { error: stationError } = await supabase
      .from("daily_station_schedule")
      .upsert(allStations, { onConflict: "schedule_date,station_id" });

    if (stationError) return NextResponse.json({ error: stationError.message }, { status: 500 });

    return NextResponse.json({ success: true, schedule_date });
  } catch (err) {
    return handleRouteError(err);
  }
}

// ── GET /api/schedule/save?date=YYYY-MM-DD ─────────────────
// Returns open_land_ids and active_station_ids for a date (admin editor)
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const date = req.nextUrl.searchParams.get("date");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date parameter" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const [{ data: landData }, { data: stationData }] = await Promise.all([
      supabase.from("daily_land_schedule").select("land_id, is_open").eq("schedule_date", date),
      supabase.from("daily_station_schedule").select("station_id, is_active").eq("schedule_date", date),
    ]);

    const openLandIds = (landData ?? []).filter(r => r.is_open).map(r => r.land_id);
    const activeStationIds = (stationData ?? []).filter(r => r.is_active).map(r => r.station_id);

    // Default: if no row for a land, treat it as open
    const allLandIds = LANDS.map(l => l.id);
    const knownLandIds = (landData ?? []).map(r => r.land_id);
    const defaultOpenIds = allLandIds.filter(id => !knownLandIds.includes(id));

    return NextResponse.json({
      schedule_date: date,
      open_land_ids: [...openLandIds, ...defaultOpenIds],
      active_station_ids: activeStationIds,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
