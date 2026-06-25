import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleRouteError } from "@/lib/auth/handle-error";
import { getPaymentProvider } from "@/lib/payments";

// ── POST /api/payments/webhook/[provider] ──────────────────
// Public endpoint hit by the payment gateway. There is no auth guard here on
// purpose — trust comes from the provider verifying the signature of the raw
// body inside verifyWebhook(). An unverified/forged call is rejected.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  try {
    const { provider: providerName } = await params;
    const provider = getPaymentProvider(providerName);

    const rawBody = await req.text();
    const result = await provider.verifyWebhook(req, rawBody);
    if (!result) {
      return NextResponse.json({ error: "Invalid or unverified webhook" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("payments")
      .update({ status: result.status, updated_at: new Date().toISOString() })
      .eq("provider_ref", result.providerRef);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
