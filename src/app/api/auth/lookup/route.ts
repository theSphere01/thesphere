import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  phone: z.string().min(8).max(20),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone } = schema.parse(body);
    const supabase = createAdminClient();

    // Normalize: strip spaces and dashes
    const normalized = phone.replace(/[\s\-()]/g, "");

    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, total_points, avatar_url, current_streak, visit_count, lands_visited")
      .or(`parent_phone.eq.${normalized},parent_phone.eq.${phone}`)
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "No profile found for this phone number" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id:             data.id,
        name:           data.name,
        total_points:   data.total_points,
        avatar_url:     data.avatar_url,
        current_streak: data.current_streak,
        visit_count:    data.visit_count,
        lands_count:    (data.lands_visited ?? []).length,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : "Lookup failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
