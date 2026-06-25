import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/guards";
import { handleRouteError } from "@/lib/auth/handle-error";
import { getPaymentProvider } from "@/lib/payments";

const CreateSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(3).max(3).default("EGP"),
  purpose: z.enum(["registration", "daily_ticket", "package", "other"]).default("other"),
  profile_id: z.string().uuid().optional(),
  description: z.string().max(300).optional(),
  provider: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ── GET /api/payments?status= ──────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await requireStaff();
    const supabase = createAdminClient();
    const status = req.nextUrl.searchParams.get("status");
    let query = supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    return handleRouteError(err);
  }
}

// ── POST /api/payments ─────────────────────────────────────
// Creates a payment record and hands off to the chosen provider.
// manual  -> stays "pending" (staff marks paid later)
// gateway -> may return a checkoutUrl for the customer to pay online
export async function POST(req: NextRequest) {
  try {
    await requireStaff();
    const body = await req.json().catch(() => ({}));
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }
    const input = parsed.data;
    const supabase = createAdminClient();
    const provider = getPaymentProvider(input.provider);

    // 1) record a pending payment
    const { data: payment, error } = await supabase
      .from("payments")
      .insert({
        profile_id: input.profile_id ?? null,
        amount: input.amount,
        currency: input.currency,
        status: "pending",
        provider: provider.name,
        purpose: input.purpose,
        description: input.description ?? null,
        metadata: input.metadata ?? {},
      })
      .select()
      .single();
    if (error || !payment) throw error ?? new Error("Failed to create payment");

    // 2) hand off to the provider
    const result = await provider.createPayment(
      { ...input, profile_id: input.profile_id ?? null },
      payment.id,
    );

    // 3) persist provider reference / initial status
    const { data: updated } = await supabase
      .from("payments")
      .update({
        status: result.status,
        provider_ref: result.providerRef ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id)
      .select()
      .single();

    return NextResponse.json(
      { data: { payment: updated ?? payment, checkoutUrl: result.checkoutUrl ?? null } },
      { status: 201 },
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
