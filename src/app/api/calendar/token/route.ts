import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { CalendarService } from "@/server/services/calendar";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await CalendarService.ensureCalendarToken(user);
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const feedUrl = `${protocol}://${host}/api/calendar/ics?token=${token}`;

    return NextResponse.json({
      success: true,
      token,
      feedUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate token";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
