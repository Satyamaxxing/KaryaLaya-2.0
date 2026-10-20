import { NextRequest } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentSession();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") || undefined;

  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Initial handshake
      controller.enqueue(
        encoder.encode(
          `event: connected\ndata: ${JSON.stringify({ time: new Date().toISOString(), user: user.name })}\n\n`
        )
      );

      let lastCheck = new Date();

      const interval = setInterval(async () => {
        if (isClosed) {
          clearInterval(interval);
          return;
        }

        try {
          const now = new Date();

          // Fetch any new activity events created since lastCheck
          const where: any = {
            organizationId: user.organizationId,
            createdAt: { gt: lastCheck },
          };

          if (projectId) {
            where.projectId = projectId;
          }

          if (user.role === "CLIENT") {
            where.actorType = { in: ["CLIENT", "INTERNAL"] };
          }

          const recentEvents = await prisma.activityEvent.findMany({
            where,
            orderBy: { createdAt: "asc" },
            take: 20,
          });

          // Unread notification count for the user
          const unreadCount = await prisma.notification.count({
            where: {
              recipientId: user.id,
              isRead: false,
            },
          });

          if (recentEvents.length > 0) {
            controller.enqueue(
              encoder.encode(`event: update\ndata: ${JSON.stringify({ events: recentEvents, unreadCount })}\n\n`)
            );
          } else {
            // Heartbeat
            controller.enqueue(
              encoder.encode(`event: heartbeat\ndata: ${JSON.stringify({ unreadCount, time: now.toISOString() })}\n\n`)
            );
          }

          lastCheck = now;
        } catch {
          // If connection severed
          isClosed = true;
          clearInterval(interval);
        }
      }, 3000);

      req.signal.addEventListener("abort", () => {
        isClosed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // Stream already closed
        }
      });
    },
    cancel() {
      isClosed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
