import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/guards";
import { handleRouteError } from "@/lib/auth/handle-error";
import { getEgyptDateString } from "@/lib/dates";

const patchSchema = z.object({
  name:          z.string().min(1).max(100).optional(),
  description:   z.string().max(500).optional(),
  tagline:       z.string().max(200).optional(),
  theme_color:   z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  is_open_today: z.boolean().optional(),
  is_active:     z.boolean().optional(),
  cover_image_url: z.string().url().optional().or(z.literal("")),
}).strict();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("lands")
      .select("*, stations(*)")
      .eq("id", id)
      .single();

    if (error) return NextResponse.json({ error: "Land not found" }, { status: 404 });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const updates = patchSchema.parse(body);
    const supabase = createAdminClient();
    const { is_open_today, ...landUpdates } = updates;

    if (Object.keys(landUpdates).length > 0) {
      const { error } = await supabase
        .from("lands")
        .update(landUpdates)
        .eq("id", id);

      if (error) throw error;
    }

    if (typeof is_open_today === "boolean") {
      const { error } = await supabase
        .from("daily_land_schedule")
        .upsert(
          {
            schedule_date: getEgyptDateString(),
            land_id: id,
            is_open: is_open_today,
          },
          { onConflict: "schedule_date,land_id" }
        );

      if (error) throw error;
    }

    return NextResponse.json({ data: { updated: true } });
  } catch (err) {
    return handleRouteError(err);
  }
}
