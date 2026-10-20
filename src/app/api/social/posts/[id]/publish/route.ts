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

    let publishedUrl: string | undefined;
    try {
      const body = await req.json();
      publishedUrl = body.publishedUrl;
    } catch {
      // optional
    }

    const result = await SocialMediaService.markPostPublished(user, id, { publishedUrl });
    return NextResponse.json({ ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to publish post";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
