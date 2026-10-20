import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { SocialMediaService } from "@/server/services/social-media";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId") || undefined;

    const accounts = await SocialMediaService.listAccounts(user, clientId);
    return NextResponse.json({ success: true, accounts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch accounts";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const account = await SocialMediaService.createAccount(user, body);
    return NextResponse.json({ success: true, account });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create account";
    const status = message.includes("Unauthorized") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
