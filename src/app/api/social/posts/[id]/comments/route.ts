import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { SocialMediaService } from "@/server/services/social-media";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { content } = body;

    const comment = await SocialMediaService.addPostComment(user, id, content);
    return NextResponse.json({ success: true, comment });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to add comment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const comments = await SocialMediaService.getPostComments(user, id);
    return NextResponse.json({ success: true, comments });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load comments";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
