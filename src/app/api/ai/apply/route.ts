import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { AiService } from "@/server/ai";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { aiOutputId, actionPayload } = body;

    if (!aiOutputId || !actionPayload) {
      return NextResponse.json({ error: "Missing aiOutputId or actionPayload" }, { status: 400 });
    }

    const result = await AiService.applyAiAction(user, aiOutputId, actionPayload);
    return NextResponse.json({ ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to apply AI proposal";
    const status = message.includes("Access Denied") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
