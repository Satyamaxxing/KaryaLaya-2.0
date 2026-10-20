import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { TeamService } from "@/server/services/team";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    const targetDueDate = searchParams.get("targetDueDate") || undefined;

    if (!memberId) {
      return NextResponse.json({ error: "memberId is required" }, { status: 400 });
    }

    const workload = await TeamService.getMemberWorkload(user, memberId, targetDueDate);
    return NextResponse.json({ success: true, workload });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to calculate workload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
