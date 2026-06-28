import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabase, createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/guards";
import { handleRouteError } from "@/lib/auth/handle-error";
import { getEgyptDateString } from "@/lib/dates";

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

    // Get profile_id from the active session.
    const { data: session } = await supabase
      .from("sessions")
      .select("id, profile_id, status")
      .eq("id", session_id)
      .eq("status", "active")
      .maybeSingle();

    if (!session?.profile_id) {
      return NextResponse.json({ error: "Active session not found. Check the camper in first." }, { status: 404 });
    }

    const today = getEgyptDateString();

    const { data: schedule } = await supabase
      .from("daily_land_schedule")
      .select("is_open")
      .eq("land_id", land_id)
      .eq("schedule_date", today)
      .maybeSingle();

    if (schedule?.is_open === false) {
      return NextResponse.json({ error: "This land is closed today." }, { status: 409 });
    }

    const { data: booking, error: bookingError } = await supabase
      .from("land_bookings")
      .select("*")
      .eq("profile_id", session.profile_id)
      .eq("land_id", land_id)
      .eq("booking_date", today)
      .neq("status", "cancelled")
      .maybeSingle();

    if (bookingError) return NextResponse.json({ error: bookingError.message }, { status: 500 });
    if (!booking) {
      return NextResponse.json({ error: "No booking found for this land today." }, { status: 409 });
    }
    if (booking.status === "completed") {
      return NextResponse.json({ error: "This booking was already completed today." }, { status: 409 });
    }

    if (booking.status === "started" && booking.land_hour_id) {
      const { data: existingLandHour } = await supabase
        .from("land_hours")
        .select("*")
        .eq("id", booking.land_hour_id)
        .maybeSingle();

      return NextResponse.json({ data: existingLandHour, booking });
    }

    const { data, error } = await supabase
      .from("land_hours")
      .insert({
        session_id,
        land_id,
        profile_id: session.profile_id,
        check_in_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const now = new Date().toISOString();
    const { data: updatedBooking, error: updateError } = await supabase
      .from("land_bookings")
      .update({
        status: "started",
        session_id,
        land_hour_id: data.id,
        started_at: now,
        updated_at: now,
      })
      .eq("id", booking.id)
      .select()
      .single();

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    return NextResponse.json({ data, booking: updatedBooking }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
