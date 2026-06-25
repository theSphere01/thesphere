import "server-only";
import type { SmsProvider } from "../types";

// Generic HTTP SMS gateway — SCAFFOLD. Adapt the fetch call to the chosen
// provider's API once selected. Env:
//   SMS_API_URL, SMS_API_KEY, SMS_SENDER
function cfg() {
  return {
    url: process.env.SMS_API_URL,
    key: process.env.SMS_API_KEY,
    sender: process.env.SMS_SENDER ?? "TheSphere",
  };
}

export const gatewayProvider: SmsProvider = {
  name: "gateway",
  isConfigured() {
    const c = cfg();
    return Boolean(c.url && c.key);
  },
  async send(to: string, message: string): Promise<void> {
    const c = cfg();
    if (!c.url || !c.key) {
      throw new Error("SMS gateway not configured (SMS_API_URL, SMS_API_KEY).");
    }
    // TODO: adapt body/headers to the real provider's API contract.
    const res = await fetch(c.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${c.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ to, from: c.sender, message }),
    });
    if (!res.ok) {
      throw new Error(`SMS gateway error ${res.status}`);
    }
  },
};
