import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { AnalyticsService } from "@/server/services/analytics";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const timeRange = (searchParams.get("timeRange") as any) || "30d";

    const data = await AnalyticsService.getAgencyAnalytics(user, timeRange);
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load analytics";
    const status = message.includes("Access Denied") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
