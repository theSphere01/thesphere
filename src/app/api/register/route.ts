import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { issueWristbandToken } from "@/lib/nfc/token";
import { normalizePhone, phoneSearchVariants } from "@/lib/phone";
import { normalizeEmail } from "@/lib/auth/parent-login";

const schema = z.object({
  child_name:   z.string().min(1).max(100),
  age:          z.number().int().min(4).max(18),
  parent_name:  z.string().min(1).max(100),
  parent_phone: z.string().min(8).max(32),
  parent_email: z.string().trim().min(3).max(254).refine(
    (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    "Valid email address required",
  ),
  nfc_uid:      z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    const parentPhone = normalizePhone(data.parent_phone);
    if (!parentPhone) {
      return NextResponse.json({ error: "Valid phone number required" }, { status: 400 });
    }
    const parentEmail = normalizeEmail(data.parent_email);
    const supabase = createAdminClient();

    const { data: existingProfiles, error: existingError } = await supabase
      .from("profiles")
      .select("parent_email")
      .in("parent_phone", phoneSearchVariants(parentPhone))
      .not("parent_email", "is", null)
      .limit(20);

    if (existingError) throw existingError;

    const existingEmails = new Set(
      (existingProfiles ?? [])
        .map((profile) => typeof profile.parent_email === "string" ? normalizeEmail(profile.parent_email) : "")
        .filter(Boolean),
    );

    if (existingEmails.size > 0 && !existingEmails.has(parentEmail)) {
      return NextResponse.json(
        { error: "This phone number is already linked to another parent email." },
        { status: 409 },
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        name:          data.child_name,
        age:           data.age,
        parent_name:   data.parent_name,
        parent_phone:  parentPhone,
        parent_email:  parentEmail,
        total_points:  0,
        season_points: 0,
        visit_count:   0,
        current_streak: 0,
        lands_visited:  [],
      })
      .select()
      .single();

    if (profileError) throw profileError;

    // Issue a SIGNED wristband token (FIX #2). The tag / QR carries this token,
    // never the raw profile UUID, so it cannot be forged without the server secret.
    const token = issueWristbandToken(profile.id);

    const wristbandInsert: Record<string, unknown> = {
      profile_id: profile.id,
      qr_code:    token,
      nfc_token:  token,
      is_active:  true,
    };
    if (data.nfc_uid) wristbandInsert.nfc_uid = data.nfc_uid;
    await supabase.from("wristbands").insert(wristbandInsert);

    return NextResponse.json({ data: { id: profile.id, name: profile.name, token } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : "Registration failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
