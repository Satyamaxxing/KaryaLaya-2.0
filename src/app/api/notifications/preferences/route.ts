import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { NotificationService } from "@/server/services";

export async function GET() {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const preferences = await NotificationService.getPreferences(user.id);
    return NextResponse.json({ preferences });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load preferences" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const preferences = await NotificationService.updatePreferences(user.id, body);
    return NextResponse.json({ preferences });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update preferences" }, { status: 400 });
  }
}
