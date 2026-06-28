import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEgyptDateString } from "@/lib/dates";
import { LANDS } from "@/lib/constants";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const getSchema = z.object({
  profile_id: z.string().uuid(),
  date: dateSchema.optional(),
});

const postSchema = z.object({
  profile_id: z.string().uuid(),
  land_id: z.string().min(1),
  booking_date: dateSchema.optional(),
});

type BookingRecord = {
  id: string;
  profile_id: string;
  land_id: string;
  booking_date: string;
  status: "booked" | "started" | "completed" | "cancelled";
  session_id: string | null;
  land_hour_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

function withLandDetails(bookings: BookingRecord[]) {
  return bookings.map((booking) => {
    const land = LANDS.find((item) => item.id === booking.land_id);
    return {
      ...booking,
      land: land
        ? {
            id: land.id,
            name: land.name,
            slug: land.slug,
            theme_color: land.theme_color,
            icon_emoji: land.icon_emoji,
          }
        : null,
    };
  });
}

async function isLandOpenToday(
  supabase: ReturnType<typeof createAdminClient>,
  landId: string,
  date: string
) {
  const { data, error } = await supabase
    .from("daily_land_schedule")
    .select("is_open")
    .eq("land_id", landId)
    .eq("schedule_date", date)
    .maybeSingle();

  if (error) throw error;
  return data?.is_open ?? true;
}

export async function GET(req: NextRequest) {
  try {
    const parsed = getSchema.safeParse({
      profile_id: req.nextUrl.searchParams.get("profile_id"),
      date: req.nextUrl.searchParams.get("date") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Valid profile_id is required" }, { status: 400 });
    }

    const date = parsed.data.date ?? getEgyptDateString();
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("land_bookings")
      .select("*")
      .eq("profile_id", parsed.data.profile_id)
      .eq("booking_date", date)
      .neq("status", "cancelled")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ data: withLandDetails((data ?? []) as BookingRecord[]) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load bookings";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid booking" }, { status: 400 });
    }

    const land = LANDS.find((item) => item.id === parsed.data.land_id);
    if (!land) {
      return NextResponse.json({ error: "Land not found" }, { status: 404 });
    }

    const bookingDate = parsed.data.booking_date ?? getEgyptDateString();
    const supabase = createAdminClient();
    const openToday = await isLandOpenToday(supabase, land.id, bookingDate);
    if (!openToday) {
      return NextResponse.json({ error: "This land is closed today." }, { status: 409 });
    }

    const match = {
      profile_id: parsed.data.profile_id,
      land_id: land.id,
      booking_date: bookingDate,
    };

    const { data: existing, error: existingError } = await supabase
      .from("land_bookings")
      .select("*")
      .match(match)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing && existing.status !== "cancelled") {
      return NextResponse.json({
        data: withLandDetails([existing as BookingRecord])[0],
        already_exists: true,
      });
    }

    if (existing?.status === "cancelled") {
      const { data, error } = await supabase
        .from("land_bookings")
        .update({
          status: "booked",
          session_id: null,
          land_hour_id: null,
          started_at: null,
          completed_at: null,
          cancelled_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ data: withLandDetails([data as BookingRecord])[0] });
    }

    const { data, error } = await supabase
      .from("land_bookings")
      .insert(match)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data: withLandDetails([data as BookingRecord])[0] }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Booking failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
