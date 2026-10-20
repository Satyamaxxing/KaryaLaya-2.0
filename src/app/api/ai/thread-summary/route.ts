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
    const { entityType, entityId } = body;

    if (!entityType || !entityId) {
      return NextResponse.json({ error: "Missing entityType or entityId" }, { status: 400 });
    }

    const result = await AiService.summarizeThread(user, { entityType, entityId });
    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to summarize discussion";
    const status = message.includes("Access Denied") || message.includes("rate limit") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
