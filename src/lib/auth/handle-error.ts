import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AuthError } from "./guards";

export function handleRouteError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid request body", details: error.flatten() },
      { status: 400 },
    );
  }

  console.error("[route error]", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
