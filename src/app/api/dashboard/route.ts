import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { DashboardService } from "@/server/services";

export async function GET(req: NextRequest) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await DashboardService.getDashboardData(user);
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
