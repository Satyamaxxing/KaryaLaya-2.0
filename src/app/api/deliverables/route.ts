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
    const deliverable = await AgencyWorkService.createDeliverable(user, {
      projectId: body.projectId,
      title: body.title,
      description: body.description,
      serviceType: body.serviceType,
      ownerId: body.ownerId,
      dueDate: body.dueDate,
      weight: body.weight,
    });

    return NextResponse.json({ deliverable }, { status: 201 });
  } catch (error: any) {
    const status = error.message?.includes("Access Denied") ? 403 : 400;
    return NextResponse.json({ error: error.message || "Failed to create deliverable" }, { status });
  }
}
