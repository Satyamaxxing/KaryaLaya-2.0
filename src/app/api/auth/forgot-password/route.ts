import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/server/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const result = await requestPasswordReset({ email, ip });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Password reset request failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
