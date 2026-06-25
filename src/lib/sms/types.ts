// Provider-agnostic SMS sending. Plug in any gateway (Twilio, an Egyptian SMS
// provider, etc.) by implementing SmsProvider.
export interface SmsProvider {
  readonly name: string;
  /** Whether the provider has the credentials it needs to actually send. */
  isConfigured(): boolean;
  send(to: string, message: string): Promise<void>;
}
