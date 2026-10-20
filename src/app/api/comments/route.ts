import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { CommentService } from "@/server/services";

export async function GET(req: NextRequest) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") || undefined;
  const deliverableId = searchParams.get("deliverableId") || undefined;
  const taskId = searchParams.get("taskId") || undefined;

  try {
    const comments = await CommentService.listComments(user, {
      projectId,
      deliverableId,
      taskId,
    });
    return NextResponse.json({ comments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const comment = await CommentService.createComment(user, {
      projectId: body.projectId,
      deliverableId: body.deliverableId,
      taskId: body.taskId,
      content: body.content,
      visibility: body.visibility,
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create comment" }, { status: 400 });
  }
}
