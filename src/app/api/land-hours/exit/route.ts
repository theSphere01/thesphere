import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabase, createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/guards";
import { handleRouteError } from "@/lib/auth/handle-error";

const ExitSchema = z.object({
  land_hour_id: z.string().min(1, "land_hour_id is required"),
  hours_completed: z.number().min(0, "hours_completed must be non-negative"),
});

// ── POST /api/land-hours/exit ──────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await requireStaff();
    const body = await req.json().catch(() => ({}));
    const parsed = ExitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { land_hour_id, hours_completed } = parsed.data;
    const now = new Date().toISOString();

    if (!hasSupabase()) {
      return NextResponse.json({
        data: {
          id: land_hour_id,
          check_out_at: now,
          hours: hours_completed,
        },
      });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("land_hours")
      .update({
        check_out_at: now,
        hours: hours_completed,
      })
      .eq("id", land_hour_id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err) {
    return handleRouteError(err);
  }
}
