import { NextRequest, NextResponse } from "next/server";
import { hasSupabase, createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/guards";
import { handleRouteError } from "@/lib/auth/handle-error";
import { verifyWristbandToken, WristbandTokenError } from "@/lib/nfc/token";
import { getEgyptDateString } from "@/lib/dates";

// ── GET /api/wristbands/lookup?qr=XXX  or  ?nfc_uid=XXX ───
export async function GET(req: NextRequest) {
  try {
    await requireStaff();
    // The wristband (QR or NFC) carries a signed token, sent as ?qr= or ?token=.
    const tokenParam = req.nextUrl.searchParams.get("token") ?? req.nextUrl.searchParams.get("qr");
    const nfc_uid = req.nextUrl.searchParams.get("nfc_uid");

    if (!tokenParam && !nfc_uid) {
      return NextResponse.json({ error: "Provide qr/token or nfc_uid query parameter" }, { status: 400 });
    }

    if (!hasSupabase()) {
      // Mock: return a fixed profile regardless of the lookup value
      const mockProfile = {
        id: "profile-001",
        name: "Omar Hassan",
        age: 12,
        total_points: 4850,
        season_points: 4850,
        visit_count: 8,
        current_streak: 3,
        lands_visited: ["land-art", "land-cooking", "land-science", "land-sports", "land-vr", "land-lego"],
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      const mockWristband = {
        id: "wb-001",
        profile_id: "profile-001",
        nfc_uid: nfc_uid ?? null,
        qr_code: tokenParam ?? "SPH-MOCK0001",
        is_active: true,
        created_at: new Date().toISOString(),
      };
      return NextResponse.json({
        data: {
          profile: mockProfile,
          wristband: mockWristband,
          active_session_id: "session-mock-001",
          bookings: [],
        },
      });
    }

    const supabase = createAdminClient();

    let wristbandQuery = supabase.from("wristbands").select("*, profile:profiles(*)");
    if (tokenParam) {
      // Verify the HMAC signature before trusting the scanned value (FIX #2).
      let pid: string;
      try {
        ({ pid } = verifyWristbandToken(tokenParam));
      } catch (e) {
        const msg = e instanceof WristbandTokenError ? e.message : "Invalid wristband";
        return NextResponse.json({ error: msg }, { status: 401 });
      }
      wristbandQuery = wristbandQuery.eq("qr_code", tokenParam).eq("profile_id", pid);
    } else {
      wristbandQuery = wristbandQuery.eq("nfc_uid", nfc_uid);
    }

    const { data: wristband, error } = await wristbandQuery
      .eq("is_active", true)
      .single();

    if (error || !wristband) {
      return NextResponse.json({ error: "Wristband not found" }, { status: 404 });
    }

    const profile = Array.isArray(wristband.profile) ? wristband.profile[0] : wristband.profile;
    const [{ data: activeSession }, { data: bookings }] = await Promise.all([
      supabase
        .from("sessions")
        .select("id")
        .eq("profile_id", profile.id)
        .eq("status", "active")
        .order("check_in_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("land_bookings")
        .select("*")
        .eq("profile_id", profile.id)
        .eq("booking_date", getEgyptDateString())
        .neq("status", "cancelled")
        .order("created_at", { ascending: true }),
    ]);

    return NextResponse.json({
      data: {
        profile,
        wristband,
        active_session_id: activeSession?.id ?? null,
        bookings: bookings ?? [],
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
