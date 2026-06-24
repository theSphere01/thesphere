import { DEFAULT_POINTS_CONFIG } from "@/lib/constants";
import type { PointsConfig, PointsResult, LandHour } from "@/lib/types";

export function calculatePoints(
  landHours: LandHour[],
  priorVisitCount: number,
  priorLandIds: string[],
  currentStreak: number,
  config: PointsConfig = DEFAULT_POINTS_CONFIG
): PointsResult {
  const breakdown: { rule: string; points: number; label: string }[] = [];
  const totalHours = landHours.reduce((sum, lh) => sum + lh.hours_completed, 0);

  // Per-hour points
  if (totalHours > 0) {
    const pts = totalHours * config.per_hour;
    breakdown.push({ rule: "per_hour", points: pts, label: `${totalHours}h × ${config.per_hour} pts` });
  }

  // Session duration bonuses
  if (totalHours >= 5) {
    breakdown.push({ rule: "bonus_5h", points: config.bonus_5h, label: `5-hour session bonus` });
  } else if (totalHours >= 3) {
    breakdown.push({ rule: "bonus_3h", points: config.bonus_3h, label: `3-hour session bonus` });
  } else if (totalHours >= 2) {
    breakdown.push({ rule: "bonus_2h", points: config.bonus_2h, label: `2-hour session bonus` });
  }

  // Return visit bonus
  if (priorVisitCount > 0) {
    breakdown.push({ rule: "return_visit", points: config.return_visit, label: `Return visit bonus` });
  }

  // New land bonus (each new land visited)
  const newLands = landHours.filter(lh => !priorLandIds.includes(lh.land_id));
  if (newLands.length > 0) {
    const pts = newLands.length * config.new_land;
    breakdown.push({ rule: "new_land", points: pts, label: `${newLands.length} new land${newLands.length > 1 ? "s" : ""} discovered` });
  }

  // Explorer bonus (first time hitting 5+ unique lands ever)
  const allLandsSoFar = new Set([...priorLandIds, ...landHours.map(lh => lh.land_id)]);
  if (allLandsSoFar.size >= 5 && priorLandIds.length < 5) {
    breakdown.push({ rule: "explorer", points: config.explorer, label: `Explorer bonus — 5 lands visited!` });
  }

  const baseTotal = breakdown.reduce((sum, b) => sum + b.points, 0);

  // Streak multiplier
  let multiplier = 1;
  if (currentStreak >= 5) multiplier = config.streak_5_multiplier;
  else if (currentStreak >= 3) multiplier = config.streak_3_multiplier;

  const multipliedTotal = Math.round(baseTotal * multiplier);

  return {
    total: baseTotal,
    breakdown,
    multiplier,
    multipliedTotal,
  };
}
