import { NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/server/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Reset token is required." }, { status: 400 });
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    const result = await resetPasswordWithToken({ token, newPassword: password });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Password reset failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
