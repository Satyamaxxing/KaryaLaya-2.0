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
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (month && year) {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      startDate = new Date(y, m - 1, 1);
      endDate = new Date(y, m, 0, 23, 59, 59);
    }

    const posts = await SocialMediaService.listPosts(user, {
      clientId: user.clientId,
      startDate,
      endDate,
    });

    return NextResponse.json({ success: true, posts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load client social calendar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
