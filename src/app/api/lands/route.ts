import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("lands")
      .select("*, stations(*)")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch lands";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
