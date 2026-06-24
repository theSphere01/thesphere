import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabase, createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/guards";
import { handleRouteError } from "@/lib/auth/handle-error";

const EnterSchema = z.object({
  session_id: z.string().min(1, "session_id is required"),
  land_id: z.string().min(1, "land_id is required"),
});

// ── POST /api/land-hours/enter ─────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await requireStaff();
    const body = await req.json().catch(() => ({}));
    const parsed = EnterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { session_id, land_id } = parsed.data;

    if (!hasSupabase()) {
      const mockLandHour = {
        id: crypto.randomUUID(),
        session_id,
        land_id,
        profile_id: null,
        check_in_at: new Date().toISOString(),
        check_out_at: null,
        hours: null,
      };
      return NextResponse.json({ data: mockLandHour }, { status: 201 });
    }

    const supabase = createAdminClient();

    // Get profile_id from session
    const { data: session } = await supabase
      .from("sessions")
      .select("profile_id")
      .eq("id", session_id)
      .single();

    const { data, error } = await supabase
      .from("land_hours")
      .insert({
        session_id,
        land_id,
        profile_id: session?.profile_id ?? null,
        check_in_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
