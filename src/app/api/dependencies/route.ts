import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { AgencyWorkService } from "@/server/services";

export async function POST(req: NextRequest) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const dependency = await AgencyWorkService.addTaskDependency(
      user,
      body.blockingTaskId,
      body.dependentTaskId
    );
    return NextResponse.json({ dependency }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create dependency" }, { status: 400 });
  }
}
