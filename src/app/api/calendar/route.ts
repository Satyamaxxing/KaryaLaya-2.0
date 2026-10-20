import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { CalendarService, CalendarEventType } from "@/server/services/calendar";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scope = (searchParams.get("scope") as "PERSONAL" | "TEAM") || "TEAM";
    const clientId = searchParams.get("clientId") || undefined;
    const projectId = searchParams.get("projectId") || undefined;
    const memberId = searchParams.get("memberId") || undefined;
    const type = (searchParams.get("type") as CalendarEventType | "ALL") || "ALL";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const data = await CalendarService.getCalendarEvents(user, {
      scope,
      clientId,
      projectId,
      memberId,
      type,
      startDate,
      endDate,
    });

    return NextResponse.json({ success: true, ...data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load calendar events";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
