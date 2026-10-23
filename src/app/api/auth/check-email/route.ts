import { NextResponse } from "next/server";
import { checkEmailExists } from "@/server/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const result = await checkEmailExists(email);
    return NextResponse.json({
      success: true,
      exists: result.exists,
      isClient: result.isClient,
      name: result.name,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to check email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
