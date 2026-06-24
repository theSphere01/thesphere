import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabase, createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/guards";
import { handleRouteError } from "@/lib/auth/handle-error";

const MOCK_CEREMONIES = [
  {
    id: "ceremony-001",
    ceremony_date: new Date().toISOString().split("T")[0],
    status: "scheduled" as const,
    total_campers: 0,
    conducted_at: null,
    winners: [],
    created_at: new Date().toISOString(),
  },
];

// ── GET /api/ceremonies ────────────────────────────────────
export async function GET(_req: NextRequest) {
  try {
    if (!hasSupabase()) {
      return NextResponse.json({ data: MOCK_CEREMONIES });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("daily_ceremonies")
      .select("*, ceremony_winners(*, profile:profiles(name, avatar_url, total_points))")
      .order("ceremony_date", { ascending: false })
      .limit(30);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── POST /api/ceremonies ───────────────────────────────────
const CreateCeremonySchema = z.object({
  ceremony_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  season_id: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const parsed = CreateCeremonySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    if (!hasSupabase()) {
      const newCeremony = {
        id: crypto.randomUUID(),
        ceremony_date: parsed.data.ceremony_date,
        status: "scheduled" as const,
        total_campers: 0,
        conducted_at: null,
        winners: [],
        created_at: new Date().toISOString(),
      };
      return NextResponse.json({ data: newCeremony }, { status: 201 });
    }

    const supabase = createAdminClient();

    // Use provided season_id or find active season
    let seasonId = parsed.data.season_id;
    if (!seasonId) {
      const { data: season } = await supabase
        .from("seasons")
        .select("id")
        .eq("is_active", true)
        .single();
      seasonId = season?.id;
    }

    const { data, error } = await supabase
      .from("daily_ceremonies")
      .insert({
        ceremony_date: parsed.data.ceremony_date,
        season_id: seasonId ?? null,
        total_campers: 0,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
