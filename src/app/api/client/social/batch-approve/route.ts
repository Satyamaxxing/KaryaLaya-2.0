import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { SocialMediaService } from "@/server/services/social-media";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { postIds } = body;

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json(
        { error: "A list of post IDs to approve is required." },
        { status: 400 }
      );
    }

    const result = await SocialMediaService.clientBatchApprove(user, { postIds });
    return NextResponse.json({ ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to batch approve posts";
    const status = message.includes("Unauthorized") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
