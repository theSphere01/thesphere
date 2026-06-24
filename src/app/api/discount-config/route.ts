import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabase, createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/guards";
import { handleRouteError } from "@/lib/auth/handle-error";
import { DEFAULT_DISCOUNT_CONFIG } from "@/lib/constants";

// ── GET /api/discount-config ───────────────────────────────
export async function GET(_req: NextRequest) {
  try {
    if (!hasSupabase()) {
      return NextResponse.json({ data: DEFAULT_DISCOUNT_CONFIG });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("discount_config")
      .select("condition_key, discount_value, is_active")
      .eq("is_active", true);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (!data || data.length === 0) {
      return NextResponse.json({ data: DEFAULT_DISCOUNT_CONFIG });
    }

    // Map DB rows back to DiscountConfig shape
    const config = { ...DEFAULT_DISCOUNT_CONFIG };
    for (const row of data) {
      switch (row.condition_key) {
        case "loyalty_2visits":   config.visit_2 = row.discount_value; break;
        case "loyalty_3visits":   config.visit_3 = row.discount_value; break;
        case "loyalty_4visits":   config.visit_4_plus = row.discount_value; break;
        case "group_5":           config.group_5 = row.discount_value; break;
        case "sibling":           config.sibling = row.discount_value; break;
        case "early_bird":        config.early_bird = row.discount_value; break;
        case "ceremony_1st":      config.ceremony_1st = row.discount_value; break;
        case "ceremony_2nd":      config.ceremony_2nd = row.discount_value; break;
        case "ceremony_3rd":      config.ceremony_3rd = row.discount_value; break;
        case "ceremony_top10":    config.ceremony_top10 = row.discount_value; break;
        case "all_participants":  config.all_participants = row.discount_value; break;
      }
    }

    return NextResponse.json({ data: config });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── PUT /api/discount-config ───────────────────────────────
const DiscountConfigSchema = z.object({
  visit_2: z.number().min(0).max(100).optional(),
  visit_3: z.number().min(0).max(100).optional(),
  visit_4_plus: z.number().min(0).max(100).optional(),
  group_5: z.number().min(0).max(100).optional(),
  sibling: z.number().min(0).max(100).optional(),
  early_bird: z.number().min(0).max(100).optional(),
  ceremony_1st: z.number().min(0).max(100).optional(),
  ceremony_2nd: z.number().min(0).max(100).optional(),
  ceremony_3rd: z.number().min(0).max(100).optional(),
  ceremony_top10: z.number().min(0).max(100).optional(),
  all_participants: z.number().min(0).max(100).optional(),
});

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const parsed = DiscountConfigSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    if (!hasSupabase()) {
      return NextResponse.json({ data: { ...DEFAULT_DISCOUNT_CONFIG, ...parsed.data } });
    }

    const supabase = createAdminClient();
    const keyMap: Record<string, string> = {
      visit_2:          "loyalty_2visits",
      visit_3:          "loyalty_3visits",
      visit_4_plus:     "loyalty_4visits",
      group_5:          "group_5",
      sibling:          "sibling",
      early_bird:       "early_bird",
      ceremony_1st:     "ceremony_1st",
      ceremony_2nd:     "ceremony_2nd",
      ceremony_3rd:     "ceremony_3rd",
      ceremony_top10:   "ceremony_top10",
      all_participants: "all_participants",
    };

    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined && keyMap[key]) {
        await supabase
          .from("discount_config")
          .update({ discount_value: value })
          .eq("condition_key", keyMap[key]);
      }
    }
    return NextResponse.json({ data: { ...DEFAULT_DISCOUNT_CONFIG, ...parsed.data } });
  } catch (err) {
    return handleRouteError(err);
  }
}
