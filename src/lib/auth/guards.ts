import "server-only";

import { createClient } from "@/lib/supabase/server";

export type StaffRole = "admin" | "staff";

export class AuthError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export interface StaffContext {
  userId: string;
  role: StaffRole;
}

function assertSupabaseAuthIsConfigured() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new AuthError(503, "Staff authentication is not configured");
  }
}

export async function getCurrentStaff(): Promise<StaffContext> {
  assertSupabaseAuthIsConfigured();

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new AuthError(401, "Not authenticated");
  }

  const { data: staffUser, error: staffError } = await supabase
    .from("staff_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (staffError || !staffUser || (staffUser.role !== "admin" && staffUser.role !== "staff")) {
    throw new AuthError(403, "Staff access required");
  }

  return { userId: user.id, role: staffUser.role };
}

export async function requireStaff(): Promise<StaffContext> {
  return getCurrentStaff();
}

export async function requireAdmin(): Promise<StaffContext> {
  const staff = await getCurrentStaff();
  if (staff.role !== "admin") {
    throw new AuthError(403, "Admin access required");
  }
  return staff;
}
