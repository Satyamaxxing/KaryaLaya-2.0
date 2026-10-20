import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { AgencyWorkService } from "@/server/services";

export async function GET(req: NextRequest) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("client") || undefined;
  const status = searchParams.get("status") || undefined;
  const ownerId = searchParams.get("owner") || undefined;

  try {
    const projects = await AgencyWorkService.listProjects(user, {
      clientId,
      status,
      ownerId,
    });
    return NextResponse.json({ projects });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to list projects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const project = await AgencyWorkService.createProject(user, {
      clientId: body.clientId,
      name: body.name,
      description: body.description,
      status: body.status,
      startDate: body.startDate,
      dueDate: body.dueDate,
      ownerId: body.ownerId,
      templateId: body.templateId,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error: any) {
    const status = error.message?.includes("Access Denied") ? 403 : 400;
    return NextResponse.json({ error: error.message || "Failed to create project" }, { status });
  }
}
