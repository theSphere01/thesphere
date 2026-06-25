// Provider-agnostic payment types. A "provider" is any gateway (manual cash,
// Flash, Paymob, Stripe, ...) that implements the PaymentProvider interface.

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "cancelled";

export type PaymentPurpose =
  | "registration"
  | "daily_ticket"
  | "package"
  | "other";

export interface Payment {
  id: string;
  profile_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  provider_ref: string | null;
  purpose: PaymentPurpose;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentInput {
  amount: number;
  currency: string;
  purpose: PaymentPurpose;
  profile_id?: string | null;
  description?: string;
  metadata?: Record<string, unknown>;
}

// Returned by a provider when a payment is initiated.
export interface ProviderCreateResult {
  status: PaymentStatus; // initial status (pending for hosted checkout, etc.)
  providerRef?: string; // the gateway's own reference id
  checkoutUrl?: string; // redirect URL for hosted checkout, if any
}

// Returned by a provider after it verifies an incoming webhook.
export interface ProviderWebhookResult {
  providerRef: string;
  status: PaymentStatus;
}

export interface PaymentProvider {
  readonly name: string;
  /** Whether the provider has the env/credentials it needs to operate. */
  isConfigured(): boolean;
  createPayment(input: CreatePaymentInput, paymentId: string): Promise<ProviderCreateResult>;
  /** Verify a webhook request; return null if invalid/unverified. */
  verifyWebhook(req: Request, rawBody: string): Promise<ProviderWebhookResult | null>;
}
