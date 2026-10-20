import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { AgencyWorkService } from "@/server/services";

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
    const subtask = await AgencyWorkService.toggleSubtask(user, id, body.isCompleted);
    return NextResponse.json({ subtask });
  } catch (error: any) {
    const status = error.message?.includes("Access Denied") ? 403 : 400;
    return NextResponse.json({ error: error.message || "Failed to update subtask" }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    await AgencyWorkService.deleteSubtask(user, id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error.message?.includes("Access Denied") ? 403 : 400;
    return NextResponse.json({ error: error.message || "Failed to delete subtask" }, { status });
  }
}
