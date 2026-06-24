import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profile_id");

    const supabase = createAdminClient();
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const hour = today.getHours();

    // Today's discount codes for this profile
    let discountCodes: unknown[] = [];
    if (profileId) {
      const { data } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("profile_id", profileId)
        .eq("is_used", false)
        .gte("valid_until", today.toISOString())
        .order("created_at", { ascending: false });
      discountCodes = data ?? [];
    }

    // Today's ceremony
    const { data: ceremonies } = await supabase
      .from("daily_ceremonies")
      .select("*")
      .eq("ceremony_date", todayStr)
      .limit(1);

    const todayCeremony = ceremonies?.[0] ?? null;

    // Build daily bonus offers based on time/day
    const bonuses: { icon: string; title: string; description: string; color: string }[] = [];

    if (hour < 14) {
      bonuses.push({
        icon:        "⏰",
        title:       "Early Bird Bonus",
        description: "Check in before 2 PM and earn the Early Bird points bonus!",
        color:       "#F39C12",
      });
    }

    const dayOfWeek = today.getDay();
    if (dayOfWeek === 3) {
      bonuses.push({
        icon:        "🌟",
        title:       "Wednesday Double Points",
        description: "It's Hump Day! Earn 2× points on all lands today.",
        color:       "#9B59B6",
      });
    }

    if (dayOfWeek === 5 || dayOfWeek === 6) {
      bonuses.push({
        icon:        "🔥",
        title:       "Weekend Explorer Bonus",
        description: "Weekends are for adventures — visit 3+ lands for a 200 pt bonus!",
        color:       "#E74C3C",
      });
    }

    bonuses.push({
      icon:        "🗺️",
      title:       "New Land Bonus",
      description: "First time visiting any land? That's 100 extra points per land!",
      color:       "#2ECC71",
    });

    return NextResponse.json({
      data: {
        discount_codes: discountCodes,
        bonuses,
        ceremony: todayCeremony
          ? {
              date:   todayCeremony.ceremony_date,
              status: todayCeremony.status,
              label:  "Ceremony today at 5 PM 🎪 — stay and compete for prizes!",
            }
          : null,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch offers";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
