import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabase, createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/guards";
import { handleRouteError } from "@/lib/auth/handle-error";
import { LANDS } from "@/lib/constants";

// ── GET /api/stations/[id] ─────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!hasSupabase()) {
      const allStations = LANDS.flatMap(l => l.stations);
      const station = allStations.find(s => s.id === id);
      if (!station) return NextResponse.json({ error: "Station not found" }, { status: 404 });
      return NextResponse.json({ data: station });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("stations")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return NextResponse.json({ error: "Station not found" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── PUT /api/stations/[id] ─────────────────────────────────
const UpdateStationSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  age_min: z.number().min(1).max(18).optional(),
  age_max: z.number().min(1).max(18).optional(),
  display_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = UpdateStationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    if (!hasSupabase()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("stations")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err) {
    return handleRouteError(err);
  }
}

// ── DELETE /api/stations/[id] ──────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    if (!hasSupabase()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("stations").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
