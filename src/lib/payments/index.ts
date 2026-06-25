import type { PaymentProvider } from "./types";
import { manualProvider } from "./providers/manual";
import { flashProvider } from "./providers/flash";

export * from "./types";

const PROVIDERS: Record<string, PaymentProvider> = {
  [manualProvider.name]: manualProvider,
  [flashProvider.name]: flashProvider,
};

// Resolve a provider by name, falling back to PAYMENTS_DEFAULT_PROVIDER, then "manual".
export function getPaymentProvider(name?: string): PaymentProvider {
  const key = (name || process.env.PAYMENTS_DEFAULT_PROVIDER || "manual").toLowerCase();
  const provider = PROVIDERS[key];
  if (!provider) {
    throw new Error(`Unknown payment provider: ${key}`);
  }
  return provider;
}

export function listPaymentProviders(): { name: string; configured: boolean }[] {
  return Object.values(PROVIDERS).map((p) => ({ name: p.name, configured: p.isConfigured() }));
}
