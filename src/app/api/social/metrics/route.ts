import { NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { SocialMediaService } from "@/server/services/social-media";

export async function GET() {
  try {
    const user = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const metrics = await SocialMediaService.getDashboardSocialMetrics(user);
    return NextResponse.json({ success: true, ...metrics });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load social metrics";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
