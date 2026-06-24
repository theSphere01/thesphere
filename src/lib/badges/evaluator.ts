import { BADGE_DEFINITIONS } from "@/lib/constants";
import type { BadgeDefinition, ProfileBadge } from "@/lib/types";

export interface ProfileStats {
  visit_count: number;
  total_points: number;
  current_streak: number;
  lands_visited: string[];
  land_visit_counts: Record<string, number>;
  ceremony_wins: number;
  earned_badge_ids: string[];
}

export function evaluateBadges(stats: ProfileStats): BadgeDefinition[] {
  const newBadges: BadgeDefinition[] = [];

  for (const badge of BADGE_DEFINITIONS) {
    if (stats.earned_badge_ids.includes(badge.id)) continue;

    let earned = false;

    switch (badge.criteria_type) {
      case "visit_count":
        earned = stats.visit_count >= badge.criteria_value;
        break;
      case "streak":
        earned = stats.current_streak >= badge.criteria_value;
        break;
      case "total_points":
        earned = stats.total_points >= badge.criteria_value;
        break;
      case "lands_count":
        earned = stats.lands_visited.length >= badge.criteria_value;
        break;
      case "land_visits":
        if (badge.criteria_land_slug) {
          const count = stats.land_visit_counts[badge.criteria_land_slug] ?? 0;
          earned = count >= badge.criteria_value;
        }
        break;
      case "ceremony_win":
        earned = stats.ceremony_wins >= badge.criteria_value;
        break;
    }

    if (earned) newBadges.push(badge);
  }

  return newBadges;
}
