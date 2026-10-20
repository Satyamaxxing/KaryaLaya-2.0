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
    const { deliverableId } = body;

    if (!deliverableId) {
      return NextResponse.json({ error: "Missing required deliverableId" }, { status: 400 });
    }

    const result = await AiService.explainRiskReason(user, deliverableId);
    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to explain risk reason";
    const status = message.includes("Access Denied") || message.includes("rate limit") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
