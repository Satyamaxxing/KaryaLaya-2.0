import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { SocialMediaService } from "@/server/services/social-media";

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

    const post = await SocialMediaService.getPost(user, id);
    return NextResponse.json({ success: true, post });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch post";
    const status = message.includes("Access denied") ? 403 : message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
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
    const updated = await SocialMediaService.updatePost(user, id, body);
    return NextResponse.json({ success: true, post: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update post";
    const status = message.includes("Unauthorized") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await SocialMediaService.deletePost(user, id);
    return NextResponse.json({ ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete post";
    const status = message.includes("Unauthorized") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
