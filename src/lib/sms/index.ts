import type { SmsProvider } from "./types";
import { consoleProvider } from "./providers/console";
import { gatewayProvider } from "./providers/gateway";

export * from "./types";

const PROVIDERS: Record<string, SmsProvider> = {
  [consoleProvider.name]: consoleProvider,
  [gatewayProvider.name]: gatewayProvider,
};

// Choose the SMS provider via SMS_PROVIDER (default "console" for testing).
export function getSmsProvider(): SmsProvider {
  const key = (process.env.SMS_PROVIDER || "console").toLowerCase();
  return PROVIDERS[key] ?? consoleProvider;
}
