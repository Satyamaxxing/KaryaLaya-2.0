import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { TeamService } from "@/server/services/team";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roster = await TeamService.getTeamRoster(user);
    return NextResponse.json({ success: true, roster, members: roster });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load team roster";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
