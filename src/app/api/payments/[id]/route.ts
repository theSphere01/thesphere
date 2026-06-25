import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/guards";
import { handleRouteError } from "@/lib/auth/handle-error";

const PatchSchema = z.object({
  status: z.enum(["pending", "paid", "failed", "refunded", "cancelled"]),
});

// ── GET /api/payments/[id] ─────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireStaff();
    const { id } = await params;
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("payments").select("*").eq("id", id).single();
    if (error || !data) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (err) {
    return handleRouteError(err);
  }
}

// ── PATCH /api/payments/[id] ───────────────────────────────
// Used mainly for the manual provider: staff mark a cash/POS payment as paid,
// or cancel/refund it.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireStaff();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("payments")
      .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error || !data) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (err) {
    return handleRouteError(err);
  }
}
