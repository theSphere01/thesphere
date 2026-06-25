import "server-only";
import { createHmac, timingSafeEqual, randomInt } from "crypto";

// One-time-code helpers for the parent phone login. Codes are never stored in
// plaintext — only an HMAC of (phone:code) is kept (see phone_otps table).
// Reuses NFC_SIGNING_SECRET as the pepper unless OTP_SECRET is set.
function pepper(): string {
  const s = process.env.OTP_SECRET || process.env.NFC_SIGNING_SECRET;
  if (!s || s.length < 16) {
    throw new Error("OTP secret not configured (set OTP_SECRET or NFC_SIGNING_SECRET)");
  }
  return s;
}

export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashOtp(code: string, phone: string): string {
  return createHmac("sha256", pepper()).update(`${phone}:${code}`).digest("hex");
}

export function verifyOtpHash(code: string, phone: string, storedHash: string): boolean {
  const expected = hashOtp(code, phone);
  const a = Buffer.from(expected);
  const b = Buffer.from(storedHash);
  return a.length === b.length && timingSafeEqual(a, b);
}
