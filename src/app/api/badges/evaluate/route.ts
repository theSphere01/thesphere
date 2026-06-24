import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { evaluateBadges } from "@/lib/badges/evaluator";
import type { ProfileStats } from "@/lib/badges/evaluator";

const ProfileStatsSchema = z.object({
  visit_count: z.number().int().min(0),
  total_points: z.number().int().min(0),
  current_streak: z.number().int().min(0),
  lands_visited: z.array(z.string()),
  land_visit_counts: z.record(z.string(), z.number()),
  ceremony_wins: z.number().int().min(0).default(0),
  earned_badge_ids: z.array(z.string()).default([]),
});

const EvaluateSchema = z.object({
  profile_id: z.string().min(1, "profile_id is required"),
  stats: ProfileStatsSchema,
});

// ── POST /api/badges/evaluate ──────────────────────────────
// Evaluates which new badges a profile has earned given their stats.
// Does NOT persist — use this for preview or trigger persistence separately.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = EvaluateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { stats } = parsed.data;
    const new_badges = evaluateBadges(stats as ProfileStats);

    return NextResponse.json({ data: { new_badges } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
