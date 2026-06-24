import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabase, createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/guards";
import { handleRouteError } from "@/lib/auth/handle-error";

const CheckInSchema = z.object({
  profile_id: z.string().min(1, "profile_id is required"),
  wristband_id: z.string().optional(),
});

// ── POST /api/sessions/check-in ────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await requireStaff();
    const body = await req.json().catch(() => ({}));
    const parsed = CheckInSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { profile_id } = parsed.data;

    if (!hasSupabase()) {
      const mockProfile = {
        id: profile_id,
        name: "Sample Camper",
        age: 10,
        total_points: 1250,
        season_points: 1250,
        visit_count: 3,
        current_streak: 2,
        lands_visited: ["land-art", "land-cooking"],
        created_at: new Date().toISOString(),
      };
      const mockSession = {
        id: crypto.randomUUID(),
        profile_id,
        season_id: "season-2025",
        status: "active",
        check_in: new Date().toISOString(),
        check_out: null,
        total_hours: 0,
        points_earned: 0,
        land_hours: [],
      };
      return NextResponse.json({ data: { session: mockSession, profile: mockProfile } }, { status: 201 });
    }

    const supabase = createAdminClient();

    // Check for existing active session
    const { data: existingSession } = await supabase
      .from("sessions")
      .select("id")
      .eq("profile_id", profile_id)
      .eq("status", "active")
      .single();

    if (existingSession) {
      return NextResponse.json({ error: "Profile already has an active session" }, { status: 409 });
    }

    // Get active season
    const { data: season } = await supabase
      .from("seasons")
      .select("id")
      .eq("is_active", true)
      .single();

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        profile_id,
        season_id: season?.id ?? null,
        status: "active",
        check_in_at: new Date().toISOString(),
        total_hours: 0,
        points_earned: 0,
      })
      .select()
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: sessionError?.message ?? "Failed to create session" }, { status: 500 });
    }

    // Fetch profile for response
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profile_id)
      .single();

    return NextResponse.json({ data: { session, profile } }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
