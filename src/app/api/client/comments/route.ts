import { NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { ClientPortalService } from "@/server/services/client-portal";

export async function POST(request: Request) {
  try {
    const user = await getCurrentSession();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, content, deliverableId } = body;

    if (!projectId || !content || !content.trim()) {
      return NextResponse.json(
        { error: "Project ID and non-empty comment content are required." },
        { status: 400 }
      );
    }

    const comment = await ClientPortalService.addClientComment(
      user,
      projectId,
      content,
      deliverableId
    );

    return NextResponse.json({ success: true, comment });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to post comment.";
    const status = message.includes("Access denied") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
