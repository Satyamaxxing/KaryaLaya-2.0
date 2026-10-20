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
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Missing required projectId" }, { status: 400 });
    }

    const result = await AiService.generateClientUpdateDraft(user, projectId);
    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate client update";
    const status = message.includes("Access Denied") || message.includes("rate limit") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
