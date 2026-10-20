import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { CalendarService } from "@/server/services/calendar";
import { prisma } from "@/server/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    let authUser = await getCurrentSession();

    // If unauthenticated or token param is supplied, look up user by persistent calendarToken
    if (token) {
      const dbUser = await prisma.user.findUnique({
        where: { calendarToken: token },
        include: {
          memberships: {
            include: { organization: true },
            take: 1,
          },
        },
      });

      if (dbUser && dbUser.memberships.length > 0) {
        const m = dbUser.memberships[0];
        authUser = {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: m.role as any,
          organizationId: m.organizationId,
          organizationName: m.organization.name,
        };
      }
    }

    if (!authUser) {
      return new NextResponse("Unauthorized: Invalid calendar feed token.", {
        status: 401,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const icsContent = await CalendarService.generateIcsFeed(authUser);

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="karyalaya-${authUser.name.toLowerCase().replace(/\s+/g, "-")}.ics"`,
        "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error exporting ICS feed";
    return new NextResponse(`Error generating calendar feed: ${message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
