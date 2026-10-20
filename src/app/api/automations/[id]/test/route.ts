import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { AutomationService } from "@/server/services/automations";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const result = await AutomationService.testRunRule(user, id, body?.payload);
    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to run test automation";
    const status = message.includes("Access Denied") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
