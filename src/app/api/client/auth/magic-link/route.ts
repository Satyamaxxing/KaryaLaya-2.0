import { NextResponse } from "next/server";
import { ClientPortalService } from "@/server/services/client-portal";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid client email address is required." },
        { status: 400 }
      );
    }

    const host = request.headers.get("host") || "localhost:3000";
    const proto = request.headers.get("x-forwarded-proto") || "http";
    const origin = `${proto}://${host}`;

    const result = await ClientPortalService.createMagicLink(email, origin);

    return NextResponse.json({
      success: true,
      message: "Magic login link generated successfully.",
      magicLinkUrl: result.magicLinkUrl,
      email: result.email,
      name: result.name,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate magic link.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
