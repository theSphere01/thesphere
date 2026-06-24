import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabase, createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/guards";
import { handleRouteError } from "@/lib/auth/handle-error";
import { LANDS } from "@/lib/constants";

// ── GET /api/stations?land_id= ─────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const landId = req.nextUrl.searchParams.get("land_id");

    if (!hasSupabase()) {
      const allStations = LANDS.flatMap(l => l.stations);
      const filtered = landId ? allStations.filter(s => s.land_id === landId) : allStations;
      return NextResponse.json({ data: filtered });
    }

    const supabase = createAdminClient();
    let query = supabase.from("stations").select("*").eq("is_active", true).order("display_order", { ascending: true });

    if (landId) query = query.eq("land_id", landId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── POST /api/stations ─────────────────────────────────────
const CreateStationSchema = z.object({
  land_id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  age_min: z.number().min(1).max(18).default(4),
  age_max: z.number().min(1).max(18).default(18),
  display_order: z.number().int().default(0),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const parsed = CreateStationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    if (!hasSupabase()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("stations")
      .insert({ ...parsed.data, is_active: true })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
