import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { prisma } from "@/server/db";

export async function GET(req: NextRequest) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";

  try {
    if (!q || q.length < 1) {
      // Return top recent items if no query
      const [projects, tasks, clients] = await Promise.all([
        prisma.project.findMany({
          where: { organizationId: user.organizationId },
          select: { id: true, name: true, status: true, progressPercent: true },
          orderBy: { updatedAt: "desc" },
          take: 5,
        }),
        prisma.task.findMany({
          where: { organizationId: user.organizationId },
          select: { id: true, title: true, status: true, priority: true, projectId: true },
          orderBy: { updatedAt: "desc" },
          take: 5,
        }),
        prisma.client.findMany({
          where: { organizationId: user.organizationId },
          select: { id: true, name: true, companyName: true },
          orderBy: { updatedAt: "desc" },
          take: 5,
        }),
      ]);

      return NextResponse.json({ projects, tasks, clients });
    }

    const [projects, tasks, clients] = await Promise.all([
      prisma.project.findMany({
        where: {
          organizationId: user.organizationId,
          OR: [
            { name: { contains: q } },
            { description: { contains: q } },
          ],
        },
        select: { id: true, name: true, status: true, progressPercent: true },
        take: 8,
      }),
      prisma.task.findMany({
        where: {
          organizationId: user.organizationId,
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
          ],
        },
        select: { id: true, title: true, status: true, priority: true, projectId: true },
        take: 10,
      }),
      prisma.client.findMany({
        where: {
          organizationId: user.organizationId,
          OR: [
            { name: { contains: q } },
            { companyName: { contains: q } },
          ],
        },
        select: { id: true, name: true, companyName: true },
        take: 8,
      }),
    ]);

    return NextResponse.json({ projects, tasks, clients });
  } catch (error: any) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: error.message || "Failed to search" }, { status: 500 });
  }
}
