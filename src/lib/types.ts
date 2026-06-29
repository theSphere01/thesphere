// ─────────────────────────────────────────────
// THE SPHERE — Type Definitions
// ─────────────────────────────────────────────

export type BadgeRarity = "common" | "rare" | "epic" | "legendary";
export type SessionStatus = "active" | "completed" | "cancelled";
export type ProfileStatus = "active" | "inactive";
export type DiscountType = "loyalty" | "group" | "sibling" | "early_bird" | "birthday" | "ceremony";

// ── Lands & Stations ───────────────────────────
export interface Station {
  id: string;
  land_id: string;
  name: string;
  description: string;
  age_min: number;
  age_max: number;
  emoji: string;
  is_active: boolean;
  sort_order: number;
}

export interface Land {
  id: string;
  name: string;
  slug: string;
  description: string;
  tagline: string;
  theme_color: string;
  icon_emoji: string;
  age_min: number;
  age_max: number;
  cover_image_url?: string;
  is_active: boolean;
  stations: Station[];
}

export interface LandPhoto {
  id: string;
  land_id: string;
  url: string;
  caption?: string;
  sort_order: number;
}

// ── Schedule ──────────────────────────────────
export interface DailyLandSchedule {
  id: string;
  schedule_date: string;
  land_id: string;
  is_open: boolean;
}

export interface DailyStationSchedule {
  id: string;
  schedule_date: string;
  station_id: string;
  is_active: boolean;
}

// ── Profiles & Wristbands ────────────────────
export interface Profile {
  id: string;
  name: string;
  age?: number;
  avatar_url?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  total_points: number;
  season_points: number;
  visit_count: number;
  current_streak: number;
  lands_visited: string[];
  created_at: string;
}

export interface Wristband {
  id: string;
  profile_id: string;
  nfc_uid?: string;
  qr_code: string;
  is_active: boolean;
  created_at: string;
}

// ── Sessions & Land Hours ────────────────────
export interface Session {
  id: string;
  profile_id: string;
  season_id: string;
  check_in: string;
  check_out?: string;
  status: SessionStatus;
  total_hours: number;
  points_earned: number;
  land_hours: LandHour[];
}

export interface LandHour {
  id: string;
  session_id: string;
  land_id: string;
  land_name: string;
  entered_at: string;
  exited_at?: string;
  hours_completed: number;
}

// ── Points ────────────────────────────────────
export interface PointsLog {
  id: string;
  profile_id: string;
  session_id?: string;
  points: number;
  rule: string;
  description: string;
  multiplier: number;
  created_at: string;
}

export interface PointsResult {
  total: number;
  breakdown: { rule: string; points: number; label: string }[];
  multiplier: number;
  multipliedTotal: number;
}

// ── Badges ────────────────────────────────────
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  emoji: string;
  rarity: BadgeRarity;
  category: string;
  criteria_type: string;
  criteria_value: number;
  criteria_land_slug?: string;
}

export interface ProfileBadge {
  id: string;
  profile_id: string;
  badge_id: string;
  earned_at: string;
  badge: BadgeDefinition;
}

// ── Discounts & Ceremonies ───────────────────
export interface DiscountCode {
  id: string;
  profile_id: string;
  code: string;
  discount_percent: number;
  discount_type: DiscountType;
  valid_until: string;
  is_used: boolean;
  created_at: string;
}

export interface Ceremony {
  id: string;
  ceremony_date: string;
  status: "scheduled" | "completed";
  winners: CeremonyWinner[];
}

export interface CeremonyWinner {
  id: string;
  ceremony_id: string;
  profile_id: string;
  rank: number;
  points_at_ceremony: number;
  prize_description: string;
  discount_percent: number;
  profile?: Profile;
}

// ── Leaderboard ───────────────────────────────
export interface LeaderboardEntry {
  rank: number;
  previous_rank?: number;
  profile_id: string;
  name: string;
  avatar_url?: string;
  total_points: number;
  visit_count: number;
  lands_count: number;
  current_streak: number;
}

// ── NFC ───────────────────────────────────────
export interface NFCPayload {
  v: number;
  pid: string;
  season: string;
}

export interface NFCReadResult {
  profileId: string;
  season: string;
  rawRecord: string;
}

// ── Config (admin-editable) ──────────────────
export interface PointsConfig {
  per_hour: number;
  bonus_2h: number;
  bonus_3h: number;
  bonus_5h: number;
  return_visit: number;
  new_land: number;
  explorer: number;
  streak_3_multiplier: number;
  streak_5_multiplier: number;
}

export interface DiscountConfig {
  visit_2: number;
  visit_3: number;
  visit_4_plus: number;
  group_5: number;
  sibling: number;
  early_bird: number;
  ceremony_1st: number;
  ceremony_2nd: number;
  ceremony_3rd: number;
  ceremony_top10: number;
  all_participants: number;
}

// ── API Response Shapes ───────────────────────
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface CheckInRequest {
  profile_id: string;
  wristband_id?: string;
}

export interface CheckOutRequest {
  session_id: string;
  profile_id: string;
}

export interface RegisterRequest {
  child_name: string;
  age: number;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  nfc_uid?: string;
}
