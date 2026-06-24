import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { issueWristbandToken } from "@/lib/nfc/token";

const schema = z.object({
  child_name:   z.string().min(1).max(100),
  age:          z.number().int().min(4).max(18),
  parent_name:  z.string().min(1).max(100),
  parent_phone: z.string().min(8).max(20),
  nfc_uid:      z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    const supabase = createAdminClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        name:          data.child_name,
        age:           data.age,
        parent_name:   data.parent_name,
        parent_phone:  data.parent_phone,
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
