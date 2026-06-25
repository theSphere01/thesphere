import "server-only";
import type {
  PaymentProvider,
  CreatePaymentInput,
  ProviderCreateResult,
  ProviderWebhookResult,
} from "../types";

// Flash payment gateway — SCAFFOLD.
// Fill in the two TODO blocks once the Flash merchant API docs + credentials
// are available. Required env vars:
//   FLASH_API_KEY, FLASH_MERCHANT_ID, FLASH_WEBHOOK_SECRET, FLASH_API_BASE
function flashConfig() {
  return {
    apiKey: process.env.FLASH_API_KEY,
    merchantId: process.env.FLASH_MERCHANT_ID,
    webhookSecret: process.env.FLASH_WEBHOOK_SECRET,
    apiBase: process.env.FLASH_API_BASE ?? "",
  };
}

export const flashProvider: PaymentProvider = {
  name: "flash",
  isConfigured() {
    const c = flashConfig();
    return Boolean(c.apiKey && c.merchantId);
  },

  async createPayment(
    _input: CreatePaymentInput,
    _paymentId: string,
  ): Promise<ProviderCreateResult> {
    const c = flashConfig();
    if (!c.apiKey || !c.merchantId) {
      throw new Error("Flash is not configured (set FLASH_API_KEY and FLASH_MERCHANT_ID).");
    }
    // TODO(flash): call the real Flash "create checkout" endpoint, e.g.
    //   const res = await fetch(`${c.apiBase}/checkout`, {
    //     method: "POST",
    //     headers: { Authorization: `Bearer ${c.apiKey}`, "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       merchant_id: c.merchantId,
    //       amount: _input.amount,
    //       currency: _input.currency,
    //       reference: _paymentId,          // our payment id, echoed back in the webhook
    //     }),
    //   });
    //   const data = await res.json();
    //   return { status: "pending", providerRef: data.id, checkoutUrl: data.checkout_url };
    throw new Error("Flash createPayment is not implemented yet — awaiting Flash API docs.");
  },

  async verifyWebhook(
    _req: Request,
    _rawBody: string,
  ): Promise<ProviderWebhookResult | null> {
    const c = flashConfig();
    if (!c.webhookSecret) return null;
    // TODO(flash): verify Flash's webhook signature, then map their event to ours, e.g.
    //   const sig = _req.headers.get("x-flash-signature") ?? "";
    //   const expected = createHmac("sha256", c.webhookSecret).update(_rawBody).digest("hex");
    //   if (!timingSafeEqualHex(sig, expected)) return null;
    //   const evt = JSON.parse(_rawBody);
    //   return { providerRef: evt.reference, status: evt.status === "paid" ? "paid" : "failed" };
    return null;
  },
};
