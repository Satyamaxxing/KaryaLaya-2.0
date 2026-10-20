import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { NotificationService } from "@/server/services";

export async function GET(req: NextRequest) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 50;

  try {
    const data = await NotificationService.listNotifications(user.id, {
      unreadOnly,
      limit,
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (body.all) {
      await NotificationService.markAllAsRead(user.id);
      return NextResponse.json({ success: true, message: "All notifications marked as read." });
    }

    if (body.id) {
      await NotificationService.markAsRead(body.id, user.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Provide notification id or all: true" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update notification status" }, { status: 500 });
  }
}
