// lib/nfc/token.ts
// FIX FOR ISSUE #2: wristbands previously stored a plaintext camper UUID. Because
// profile UUIDs appear in shareable profile URLs, anyone could copy one onto a
// blank tag and impersonate a camper. We now write a SIGNED token to the tag and
// verify the HMAC signature server-side on every scan, so a tag can no longer be
// forged without the server secret. Revocation is handled by wristbands.is_active.
//
// Token layout:  <base64url(payload)>.<base64url(hmac-sha256)>
//   payload = { v, pid, iat, exp? }

import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

function getSecret(): string {
  const s = process.env.NFC_SIGNING_SECRET;
  if (!s || s.length < 32) {
    throw new Error("NFC_SIGNING_SECRET missing or too short (need >= 32 chars)");
  }
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export interface WristbandClaims {
  v: number; // token version
  pid: string; // camper profile id
  iat: number; // issued-at (unix seconds)
  exp?: number; // optional expiry (unix seconds)
}

export class WristbandTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WristbandTokenError";
  }
}

// Bands are reusable across visits, so by default the token does not expire;
// a lost/old band is revoked by flipping wristbands.is_active to false.
export function issueWristbandToken(profileId: string, ttlSeconds?: number): string {
  const now = Math.floor(Date.now() / 1000);
  const claims: WristbandClaims = {
    v: 1,
    pid: profileId,
    iat: now,
    ...(ttlSeconds ? { exp: now + ttlSeconds } : {}),
  };
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyWristbandToken(token: string): WristbandClaims {
  const parts = token.split(".");
  if (parts.length !== 2) throw new WristbandTokenError("Malformed wristband token");

  const [payload, providedSig] = parts;
  const expectedSig = sign(payload);

  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  // length check first so timingSafeEqual never throws, then constant-time compare
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new WristbandTokenError("Invalid wristband signature");
  }

  let claims: WristbandClaims;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    throw new WristbandTokenError("Corrupt wristband payload");
  }

  if (claims.exp && Math.floor(Date.now() / 1000) > claims.exp) {
    throw new WristbandTokenError("Wristband token expired");
  }
  return claims;
}
