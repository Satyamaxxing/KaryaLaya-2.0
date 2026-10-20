import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { logger } from "@/server/logger";

const startTime = Date.now();

export async function GET() {
  try {
    // Perform a lightweight database ping
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
        database: "connected",
        version: "2.0.0",
        environment: process.env.NODE_ENV || "development",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    logger.error("Health check database ping failed", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
        database: "disconnected",
        error: error instanceof Error ? error.message : "Database connection failed",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }
}
