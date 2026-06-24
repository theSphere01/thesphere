import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabase, createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/guards";
import { handleRouteError } from "@/lib/auth/handle-error";
import { calculatePoints } from "@/lib/points/calculator";
import { evaluateBadges } from "@/lib/badges/evaluator";
import { getVisitDiscount, generateCode } from "@/lib/discounts/generator";
import type { LandHour } from "@/lib/types";

const LandHourInputSchema = z.object({
  land_id: z.string().min(1),
  land_name: z.string().min(1),
  hours_completed: z.number().min(0),
});

const CheckOutSchema = z.object({
  session_id: z.string().min(1, "session_id is required"),
  profile_id: z.string().min(1, "profile_id is required"),
  // Accepted for backwards-compatibility, but only used as a fallback when no
  // per-land scans were recorded — and even then it is clamped to the real
  // session duration. The server never trusts these numbers blindly (FIX #3).
  land_hours: z.array(LandHourInputSchema).default([]),
});

// ── POST /api/sessions/check-out ───────────────────────────
export async function POST(req: NextRequest) {
  try {
    await requireStaff();
    const body = await req.json().catch(() => ({}));
    const parsed = CheckOutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { session_id, profile_id, land_hours: landHoursInput } = parsed.data;
    const now = new Date().toISOString();

    if (!hasSupabase()) {
      // Mock branch (design preview only — unreachable once auth is configured)
      const priorVisitCount = 2;
      const priorLandIds = ["land-art"];
      const currentStreak = 1;
      const landHours: LandHour[] = landHoursInput.map((lh, i) => ({
        id: `lh-${i}`, session_id, land_id: lh.land_id, land_name: lh.land_name,
        entered_at: now, exited_at: now, hours_completed: lh.hours_completed,
      }));
      const points_result = calculatePoints(landHours, priorVisitCount, priorLandIds, currentStreak);
      const new_badges = evaluateBadges({
        visit_count: priorVisitCount + 1,
        total_points: 1250 + points_result.multipliedTotal,
        current_streak: currentStreak,
        lands_visited: [...new Set([...priorLandIds, ...landHours.map(lh => lh.land_id)])],
        land_visit_counts: {}, ceremony_wins: 0, earned_badge_ids: [],
      });
      const visitDiscount = getVisitDiscount(priorVisitCount + 1);
      const discount = visitDiscount
        ? { code: generateCode(), discount_percent: visitDiscount.percent, type: visitDiscount.type }
        : null;
      return NextResponse.json({
        data: {
          points_result, new_badges, discount,
          profile: { id: profile_id, name: "Sample Camper", total_points: 1250 + points_result.multipliedTotal },
        },
      });
    }

    const supabase = createAdminClient();

    // Fetch session and profile
    const [sessionRes, profileRes] = await Promise.all([
      supabase.from("sessions").select("*").eq("id", session_id).single(),
      supabase.from("profiles").select("*").eq("id", profile_id).single(),
    ]);

    if (!sessionRes.data || sessionRes.error) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (!profileRes.data || profileRes.error) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const session = sessionRes.data;
    const profile = profileRes.data;

    // ── Idempotency guard ──────────────────────────────────
    // If this session was already checked out, return the stored result
    // without re-awarding points, badges, or discounts.
    if (session.status === "completed") {
      const { data: existing } = await supabase
        .from("profiles").select("*").eq("id", profile_id).single();
      return NextResponse.json({
        data: {
          was_already_checked_out: true,
          points_result: {
            total: session.points_earned ?? 0,
            breakdown: [],
            multiplier: 1,
            multipliedTotal: session.points_earned ?? 0,
          },
          new_badges: [],
          discount: null,
          profile: existing ?? profile,
        },
      });
    }

    // ── Server-authoritative land hours (FIX #3) ───────────
    // Hours come from the recorded land_hours rows, never from the client.
    // Each value is capped at the real session elapsed time so totals can't
    // be inflated. If no per-land scans exist, fall back to the staff-entered
    // figures, still clamped to the session duration.
    const sessionStart = new Date(session.check_in_at ?? now).getTime();
    const sessionElapsedHours = Math.max(0, (Date.now() - sessionStart) / 3_600_000);
    const cap = sessionElapsedHours > 0 ? sessionElapsedHours + 0.5 : Number.POSITIVE_INFINITY;

    const { data: dbLandHours } = await supabase
      .from("land_hours")
      .select("id, land_id, check_in_at, check_out_at, hours")
      .eq("session_id", session_id);

    let landHours: LandHour[];
    if (dbLandHours && dbLandHours.length > 0) {
      landHours = dbLandHours.map((lh) => {
        const recorded = lh.hours != null
          ? Number(lh.hours)
          : Math.max(0, (Date.now() - new Date(lh.check_in_at).getTime()) / 3_600_000);
        return {
          id: lh.id,
          session_id,
          land_id: lh.land_id,
          land_name: "",
          entered_at: lh.check_in_at,
          exited_at: lh.check_out_at ?? now,
          hours_completed: Math.min(recorded, cap),
        };
      });
    } else {
      landHours = landHoursInput.map((lh, i) => ({
        id: `lh-${i}`,
        session_id,
        land_id: lh.land_id,
        land_name: lh.land_name,
        entered_at: session.check_in_at ?? now,
        exited_at: now,
        hours_completed: Math.min(lh.hours_completed, cap),
      }));
    }

    // Cap the TOTAL too — a camper cannot have spent more land-time than the
    // session itself lasted.
    let totalHours = landHours.reduce((sum, lh) => sum + lh.hours_completed, 0);
    if (cap !== Number.POSITIVE_INFINITY && totalHours > cap && totalHours > 0) {
      const scale = cap / totalHours;
      landHours = landHours.map((lh) => ({ ...lh, hours_completed: lh.hours_completed * scale }));
      totalHours = cap;
    }

    // Prior unique lands (excluding this session)
    const { data: priorLandHoursData } = await supabase
      .from("land_hours")
      .select("land_id")
      .eq("profile_id", profile_id)
      .not("session_id", "eq", session_id);
    const priorLandIds = [...new Set((priorLandHoursData ?? []).map((r: { land_id: string }) => r.land_id))];

    // Already-earned badges
    const { data: earnedBadgesData } = await supabase
      .from("profile_badges").select("badge_id").eq("profile_id", profile_id);
    const earnedBadgeIds = (earnedBadgesData ?? []).map((r: { badge_id: string }) => r.badge_id);

    // Per-land visit counts
    const { data: landVisitData } = await supabase
      .from("land_hours").select("land_id").eq("profile_id", profile_id);
    const landVisitCounts: Record<string, number> = {};
    for (const row of (landVisitData ?? [])) {
      landVisitCounts[row.land_id] = (landVisitCounts[row.land_id] ?? 0) + 1;
    }

    const points_result = calculatePoints(
      landHours,
      profile.visit_count ?? 0,
      priorLandIds,
      profile.current_streak ?? 0
    );

    const today = new Date().toISOString().split("T")[0];
    const lastVisit = profile.last_visit_date ?? null;
    const isConsecutive =
      lastVisit && new Date(today).getTime() - new Date(lastVisit).getTime() === 86_400_000;
    const newStreak = isConsecutive ? (profile.current_streak ?? 0) + 1 : 1;
    const newVisitCount = (profile.visit_count ?? 0) + 1;
    const allLandsVisited = [...new Set([...priorLandIds, ...landHours.map(lh => lh.land_id)])];

    const new_badges = evaluateBadges({
      visit_count: newVisitCount,
      total_points: (profile.total_points ?? 0) + points_result.multipliedTotal,
      current_streak: newStreak,
      lands_visited: allLandsVisited,
      land_visit_counts: landVisitCounts,
      ceremony_wins: 0,
      earned_badge_ids: earnedBadgeIds,
    });

    // ── Claim the session (atomic active -> completed) ─────
    // Only the request that flips the status proceeds to mutate the profile.
    // A concurrent duplicate finds status already 'completed' and no-ops.
    const { data: claimed } = await supabase
      .from("sessions")
      .update({
        status: "completed",
        check_out_at: now,
        total_hours: totalHours,
        points_earned: points_result.multipliedTotal,
      })
      .eq("id", session_id)
      .eq("status", "active")
      .select()
      .single();

    if (!claimed) {
      const { data: existing } = await supabase
        .from("profiles").select("*").eq("id", profile_id).single();
      return NextResponse.json({
        data: {
          was_already_checked_out: true,
          points_result: { total: 0, breakdown: [], multiplier: 1, multipliedTotal: 0 },
          new_badges: [],
          discount: null,
          profile: existing ?? profile,
        },
      });
    }

    // Update profile totals
    await supabase
      .from("profiles")
      .update({
        total_points: (profile.total_points ?? 0) + points_result.multipliedTotal,
        visit_count: newVisitCount,
        current_streak: newStreak,
        last_visit_date: today,
      })
      .eq("id", profile_id);

    // Log points — unique (session_id, rule_type) makes this idempotent.
    if (points_result.breakdown.length > 0) {
      await supabase
        .from("points_log")
        .upsert(
          points_result.breakdown.map((entry) => ({
            profile_id,
            session_id,
            rule_type: entry.rule,
            points_awarded: Math.round(entry.points * points_result.multiplier),
            notes: entry.label,
          })),
          { onConflict: "session_id,rule_type", ignoreDuplicates: true }
        );
    }

    // Award badges — unique (profile_id, badge_id) makes this idempotent.
    if (new_badges.length > 0) {
      await supabase
        .from("profile_badges")
        .upsert(
          new_badges.map((badge) => ({ profile_id, badge_id: badge.id, earned_at: now })),
          { onConflict: "profile_id,badge_id", ignoreDuplicates: true }
        );
    }

    // Loyalty discount
    const visitDiscount = getVisitDiscount(newVisitCount);
    let discountRecord: { code: string; discount_percent: number; type: string } | null = null;
    if (visitDiscount) {
      const code = generateCode();
      const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      discountRecord = { code, discount_percent: visitDiscount.percent, type: visitDiscount.type };
      await supabase.from("discount_codes").insert({
        profile_id,
        session_id,
        code,
        discount_percent: visitDiscount.percent,
        discount_type: visitDiscount.type,
        valid_until: validUntil,
        is_used: false,
      });
    }

    const { data: updatedProfile } = await supabase
      .from("profiles").select("*").eq("id", profile_id).single();

    return NextResponse.json({
      data: { points_result, new_badges, discount: discountRecord, profile: updatedProfile },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
