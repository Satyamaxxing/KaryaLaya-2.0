import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { SocialMediaService } from "@/server/services/social-media";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId") || undefined;
    const platform = searchParams.get("platform") || undefined;
    const status = searchParams.get("status") || undefined;
    const assigneeId = searchParams.get("assigneeId") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const search = searchParams.get("search") || undefined;

    const posts = await SocialMediaService.listPosts(user, {
      clientId,
      platform,
      status,
      assigneeId,
      startDate,
      endDate,
      search,
    });

    return NextResponse.json({ success: true, posts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch posts";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const post = await SocialMediaService.createPost(user, body);
    return NextResponse.json({ success: true, post });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create post";
    const status = message.includes("Unauthorized") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
