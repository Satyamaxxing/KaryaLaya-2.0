import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { AgencyWorkService } from "@/server/services";

export async function GET(req: NextRequest) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") || undefined;
  const entityId = searchParams.get("entityId") || undefined;
  const entityType = searchParams.get("entityType") || undefined;
  const actorType = searchParams.get("actorType") || undefined;
  const actorId = searchParams.get("actorId") || undefined;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;

  try {
    const events = await AgencyWorkService.listActivityEvents(user, {
      projectId,
      entityId,
      entityType,
      actorType,
      actorId,
      limit,
    });
    return NextResponse.json({ events });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to list activity events" }, { status: 500 });
  }
}
