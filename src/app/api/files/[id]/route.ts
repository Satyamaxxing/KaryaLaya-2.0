import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { FileService } from "@/server/services";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const file = await FileService.getFile(user, id);
    return NextResponse.json({ file });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "File not found" }, { status: 404 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    if (!body.visibility || !["INTERNAL", "CLIENT_VISIBLE"].includes(body.visibility)) {
      return NextResponse.json({ error: "Invalid visibility value. Must be INTERNAL or CLIENT_VISIBLE" }, { status: 400 });
    }

    const updated = await FileService.updateVisibility(user, id, body.visibility);
    return NextResponse.json({ file: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update visibility" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await FileService.deleteFile(user, id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete file" }, { status: 400 });
  }
}
