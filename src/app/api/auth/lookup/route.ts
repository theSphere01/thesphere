import { NextResponse } from "next/server";

// DISABLED (security): this endpoint previously returned a camper profile for
// any phone number with no verification — letting anyone open anyone's account.
// Parent access now requires either the unguessable profile link/QR from
// registration, or a phone + SMS one-time code (see /api/auth/otp/*).
export async function POST() {
  return NextResponse.json(
    { error: "This endpoint has been disabled. Use the verification code flow or your profile link." },
    { status: 410 },
  );
}
