import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const cancelSchema = z.object({
  profile_id: z.string().uuid(),
});

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsed = cancelSchema.safeParse({
      profile_id: req.nextUrl.searchParams.get("profile_id"),
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Valid profile_id is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: booking, error: lookupError } = await supabase
      .from("land_bookings")
      .select("id, profile_id, status")
      .eq("id", id)
      .eq("profile_id", parsed.data.profile_id)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.status === "started" || booking.status === "completed") {
      return NextResponse.json({ error: "This booking has already started." }, { status: 409 });
    }

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("land_bookings")
      .update({ status: "cancelled", cancelled_at: now, updated_at: now })
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ data: { cancelled: true } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not cancel booking";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
