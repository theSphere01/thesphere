import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabase, createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/guards";
import { handleRouteError } from "@/lib/auth/handle-error";
import { DEFAULT_POINTS_CONFIG } from "@/lib/constants";

// ── GET /api/points-config ─────────────────────────────────
export async function GET(_req: NextRequest) {
  try {
    if (!hasSupabase()) {
      return NextResponse.json({ data: DEFAULT_POINTS_CONFIG });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("points_config")
      .select("rule_type, value, is_active")
      .eq("is_active", true);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (!data || data.length === 0) {
      return NextResponse.json({ data: DEFAULT_POINTS_CONFIG });
    }

    // Map DB rows back to PointsConfig shape
    const config = { ...DEFAULT_POINTS_CONFIG };
    for (const row of data) {
      switch (row.rule_type) {
        case "per_land_hour":          config.per_hour = row.value; break;
        case "session_bonus_2hr":      config.bonus_2h = row.value; break;
        case "session_bonus_3hr":      config.bonus_3h = row.value; break;
        case "session_bonus_5hr":      config.bonus_5h = row.value; break;
        case "return_visit_bonus":     config.return_visit = row.value; break;
        case "new_land_bonus":         config.new_land = row.value; break;
        case "explorer_bonus":         config.explorer = row.value; break;
        case "streak_3day_multiplier": config.streak_3_multiplier = row.value; break;
        case "streak_5visit_multiplier": config.streak_5_multiplier = row.value; break;
      }
    }

    return NextResponse.json({ data: config });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── PUT /api/points-config ─────────────────────────────────
const PointsConfigSchema = z.object({
  per_hour: z.number().min(0).optional(),
  bonus_2h: z.number().min(0).optional(),
  bonus_3h: z.number().min(0).optional(),
  bonus_5h: z.number().min(0).optional(),
  return_visit: z.number().min(0).optional(),
  new_land: z.number().min(0).optional(),
  explorer: z.number().min(0).optional(),
  streak_3_multiplier: z.number().min(1).optional(),
  streak_5_multiplier: z.number().min(1).optional(),
});

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const parsed = PointsConfigSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    if (!hasSupabase()) {
      return NextResponse.json({ data: { ...DEFAULT_POINTS_CONFIG, ...parsed.data } });
    }

    const supabase = createAdminClient();
    const ruleMap: Record<string, string> = {
      per_hour:             "per_land_hour",
      bonus_2h:             "session_bonus_2hr",
      bonus_3h:             "session_bonus_3hr",
      bonus_5h:             "session_bonus_5hr",
      return_visit:         "return_visit_bonus",
      new_land:             "new_land_bonus",
      explorer:             "explorer_bonus",
      streak_3_multiplier:  "streak_3day_multiplier",
      streak_5_multiplier:  "streak_5visit_multiplier",
    };

    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined && ruleMap[key]) {
        await supabase
          .from("points_config")
          .update({ value, updated_at: new Date().toISOString() })
          .eq("rule_type", ruleMap[key]);
      }
    }
    return NextResponse.json({ data: { ...DEFAULT_POINTS_CONFIG, ...parsed.data } });
  } catch (err) {
    return handleRouteError(err);
  }
}
