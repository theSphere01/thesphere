import { NextRequest, NextResponse } from "next/server";
import { hasSupabase, createAdminClient } from "@/lib/supabase/admin";
import { BADGE_DEFINITIONS } from "@/lib/constants";

// ── GET /api/badges ────────────────────────────────────────
// Returns full badge catalog
export async function GET(_req: NextRequest) {
  try {
    if (!hasSupabase()) {
      return NextResponse.json({ data: BADGE_DEFINITIONS });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("badge_definitions")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    // Fall back to constants if table is empty
    return NextResponse.json({ data: data?.length ? data : BADGE_DEFINITIONS });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
