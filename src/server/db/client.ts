import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function resolveDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL?.trim();
  const isVercel = Boolean(
    process.env.VERCEL ||
    process.env.VERCEL_ENV ||
    process.env.NEXT_PUBLIC_VERCEL_ENV
  );
  const isProduction = process.env.NODE_ENV === "production" || isVercel;

  if (url) {
    if (isProduction && url.startsWith("file:")) {
      throw new Error(
        "[Prisma Error] SQLite file database ('" +
          url +
          "') is not supported in production / Vercel serverless deployments. Please configure a PostgreSQL connection string in the DATABASE_URL environment variable."
      );
    }
    return url;
  }

  // In production / Vercel, never fall back to local sqlite file
  if (isProduction) {
    return undefined;
  }

  // Safe fallback for local development & test runs
  return "file:./dev.db";
}

const resolvedUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(resolvedUrl ? { datasources: { db: { url: resolvedUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "@prisma/client";
