import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabase, createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/guards";
import { handleRouteError } from "@/lib/auth/handle-error";
import { CEREMONY_PRIZES, DEFAULT_DISCOUNT_CONFIG } from "@/lib/constants";
import { generateCode } from "@/lib/discounts/generator";
import { addDays, format } from "date-fns";

// ── GET /api/ceremonies/[id] ───────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!hasSupabase()) {
      return NextResponse.json({
        data: {
          id,
          ceremony_date: new Date().toISOString().split("T")[0],
          status: "scheduled",
          total_campers: 0,
          conducted_at: null,
          winners: [],
          created_at: new Date().toISOString(),
        },
      });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("daily_ceremonies")
      .select("*, ceremony_winners(*, profile:profiles(name, avatar_url, total_points, visit_count, current_streak))")
      .eq("id", id)
      .single();

    if (error || !data) return NextResponse.json({ error: "Ceremony not found" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── PUT /api/ceremonies/[id] ───────────────────────────────
// Update ceremony winners and generate discount codes
const WinnerSchema = z.object({
  profile_id: z.string().min(1),
  rank: z.number().int().min(1),
  points_at_ceremony: z.number().int().min(0),
});

const UpdateCeremonySchema = z.object({
  winners: z.array(WinnerSchema).min(1),
  conducted_by: z.string().uuid().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = UpdateCeremonySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { winners, conducted_by } = parsed.data;

    if (!hasSupabase()) {
      const winnersWithPrizes = winners.map(w => {
        const prize = CEREMONY_PRIZES.find(p =>
          w.rank === p.rank || (p.max && w.rank >= p.rank && w.rank <= p.max)
        );
        return {
          ...w,
          ceremony_id: id,
          discount_code: generateCode(),
          discount_percent: prize?.discount ?? DEFAULT_DISCOUNT_CONFIG.all_participants,
          prize_description: prize?.prize ?? "Participation certificate",
        };
      });
      return NextResponse.json({ data: { id, winners: winnersWithPrizes } });
    }

    const supabase = createAdminClient();

    // Delete existing winners for this ceremony
    await supabase.from("ceremony_winners").delete().eq("ceremony_id", id);

    // Insert new winners
    const winnerInserts = winners.map(w => ({
      ceremony_id: id,
      profile_id: w.profile_id,
      rank: w.rank,
      points_earned: w.points_at_ceremony,
    }));

    const { data: insertedWinners, error: winnersError } = await supabase
      .from("ceremony_winners")
      .insert(winnerInserts)
      .select();

    if (winnersError) return NextResponse.json({ error: winnersError.message }, { status: 500 });

    // Generate discount codes for winners
    const discountInserts = winners.map(w => {
      const prize = CEREMONY_PRIZES.find(p =>
        w.rank === p.rank || (p.max && w.rank >= p.rank && w.rank <= p.max)
      );
      const discount = prize?.discount ?? DEFAULT_DISCOUNT_CONFIG.all_participants;
      const validDays = prize?.valid_days ?? 3;
      return {
        profile_id: w.profile_id,
        code: generateCode(),
        discount_percent: discount,
        discount_type: "ceremony" as const,
        valid_until: format(addDays(new Date(), validDays), "yyyy-MM-dd"),
        is_used: false,
      };
    });

    await supabase.from("discount_codes").insert(discountInserts);

    // Mark ceremony as conducted
    const { data: ceremony, error: ceremonyError } = await supabase
      .from("daily_ceremonies")
      .update({
        total_campers: winners.length,
        conducted_at: new Date().toISOString(),
        conducted_by: conducted_by ?? null,
      })
      .eq("id", id)
      .select()
      .single();

    if (ceremonyError) return NextResponse.json({ error: ceremonyError.message }, { status: 500 });

    return NextResponse.json({ data: { ...ceremony, winners: insertedWinners } });
  } catch (err) {
    return handleRouteError(err);
  }
}
