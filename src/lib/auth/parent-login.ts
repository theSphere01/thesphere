import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone, phoneSearchVariants } from "@/lib/phone";

export type LoginProfile = {
  id: string;
  name: string;
  total_points: number | null;
  avatar_url?: string | null;
  current_streak: number | null;
  visit_count: number | null;
  lands_visited?: string[] | null;
  parent_email?: string | null;
};

export class ParentLoginError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ParentLoginError";
  }
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(2, local.length - visible.length))}@${domain}`;
}

export function toLoginProfile(profile: LoginProfile) {
  return {
    id: profile.id,
    name: profile.name,
    total_points: profile.total_points ?? 0,
    avatar_url: profile.avatar_url ?? undefined,
    current_streak: profile.current_streak ?? 0,
    visit_count: profile.visit_count ?? 0,
    lands_count: (profile.lands_visited ?? []).length,
  };
}

export async function getParentLoginBundle(phone: string) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    throw new ParentLoginError(400, "Please enter a valid phone number.");
  }

  const supabase = createAdminClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, name, total_points, avatar_url, current_streak, visit_count, lands_visited, parent_email")
    .in("parent_phone", phoneSearchVariants(normalizedPhone))
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  if (!profiles?.length) {
    throw new ParentLoginError(404, "No registered profile found for this phone number.");
  }

  const emails = Array.from(
    new Set(
      profiles
        .map((profile) => (profile.parent_email ? normalizeEmail(profile.parent_email) : ""))
        .filter(Boolean),
    ),
  );

  if (emails.length === 0) {
    throw new ParentLoginError(409, "This phone number has no parent email yet. Register again or ask staff to add the email.");
  }

  if (emails.length > 1) {
    throw new ParentLoginError(409, "This phone number is linked to more than one email. Ask staff to fix the profile emails.");
  }

  return {
    email: emails[0],
    normalizedPhone,
    profiles,
    loginProfiles: profiles.map(toLoginProfile),
  };
}
