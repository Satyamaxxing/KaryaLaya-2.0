import { NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { AutomationService } from "@/server/services/automations";

export async function POST() {
  try {
    const user = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const retriedRuns = await AutomationService.processPendingRetries(user.organizationId);
    return NextResponse.json({ success: true, processedCount: retriedRuns.length, runs: retriedRuns });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process retries";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
