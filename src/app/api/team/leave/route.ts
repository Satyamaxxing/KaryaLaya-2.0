import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { TeamService } from "@/server/services/team";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, startDate, endDate, reason } = body;

    if (!userId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Member, start date, and end date are required." },
        { status: 400 }
      );
    }

    const leave = await TeamService.recordLeave(user, {
      userId,
      startDate,
      endDate,
      reason,
    });

    return NextResponse.json({ success: true, leave });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to record leave";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Leave ID is required." }, { status: 400 });
    }

    const result = await TeamService.deleteLeave(user, id);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete leave record";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
