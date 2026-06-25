import "server-only";
import type { SmsProvider } from "../types";

// Development / testing provider: logs the message to the server console
// instead of sending a real SMS. Lets the OTP flow be tested end-to-end
// before a real SMS gateway is connected. NOT for production.
export const consoleProvider: SmsProvider = {
  name: "console",
  isConfigured() {
    return true;
  },
  async send(to: string, message: string): Promise<void> {
    console.log(`[SMS:console] to=${to} :: ${message}`);
  },
};
