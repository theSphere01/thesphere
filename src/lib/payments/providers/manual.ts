import type {
  PaymentProvider,
  ProviderCreateResult,
  ProviderWebhookResult,
} from "../types";

// Manual provider: the payment is settled in person (cash / POS). It is
// recorded as "pending" and a staff member marks it "paid" once collected
// (PATCH /api/payments/[id]). No external gateway is involved, so it works
// out of the box with no configuration.
export const manualProvider: PaymentProvider = {
  name: "manual",
  isConfigured() {
    return true;
  },
  async createPayment(): Promise<ProviderCreateResult> {
    return { status: "pending" };
  },
  async verifyWebhook(): Promise<ProviderWebhookResult | null> {
    return null; // manual payments have no webhook
  },
};
