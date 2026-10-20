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
    const task = await AgencyWorkService.createTask(user, {
      projectId: body.projectId,
      deliverableId: body.deliverableId,
      title: body.title,
      description: body.description,
      assigneeId: body.assigneeId,
      priority: body.priority,
      startDate: body.startDate,
      dueDate: body.dueDate,
      estimateHours: body.estimateHours !== undefined ? Number(body.estimateHours) : undefined,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error: any) {
    const status = error.message?.includes("Access Denied") ? 403 : 400;
    return NextResponse.json({ error: error.message || "Failed to create task" }, { status });
  }
}
