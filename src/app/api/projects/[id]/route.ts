import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { AgencyWorkService } from "@/server/services";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const project = await AgencyWorkService.getProjectById(user, id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({ project });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch project" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const body = await req.json();
    const updated = await AgencyWorkService.updateProject(user, id, {
      name: body.name,
      description: body.description,
      status: body.status,
      startDate: body.startDate,
      dueDate: body.dueDate,
      ownerId: body.ownerId,
    });

    return NextResponse.json({ project: updated });
  } catch (error: any) {
    const status = error.message?.includes("Access Denied") ? 403 : 400;
    return NextResponse.json({ error: error.message || "Failed to update project" }, { status });
  }
}
