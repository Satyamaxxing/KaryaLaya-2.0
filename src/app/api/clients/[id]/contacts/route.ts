import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { AgencyWorkService } from "@/server/services";

export async function POST(
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
    const contact = await AgencyWorkService.addClientContact(user, id, {
      name: body.name,
      email: body.email,
      title: body.title,
      canApprove: body.canApprove,
    });

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error: any) {
    const status = error.message?.includes("Access Denied") ? 403 : 400;
    return NextResponse.json({ error: error.message || "Failed to add contact" }, { status });
  }
}
