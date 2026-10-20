import { prisma } from "../db";

interface RateLimitOptions {
  key: string;
  maxAttempts: number;
  windowMs: number;
}

export async function checkRateLimit({
  key,
  maxAttempts,
  windowMs,
}: RateLimitOptions): Promise<{ allowed: boolean; remaining: number }> {
  const now = new Date();
  const existing = await prisma.rateLimit.findUnique({
    where: { key },
  });

  if (!existing || existing.expireAt < now) {
    // Reset window
    await prisma.rateLimit.upsert({
      where: { key },
      create: {
        key,
        points: 1,
        expireAt: new Date(now.getTime() + windowMs),
      },
      update: {
        points: 1,
        expireAt: new Date(now.getTime() + windowMs),
      },
    });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (existing.points >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  await prisma.rateLimit.update({
    where: { key },
    data: { points: existing.points + 1 },
  });

  return { allowed: true, remaining: maxAttempts - (existing.points + 1) };
}

export async function resetRateLimit(key: string): Promise<void> {
  try {
    await prisma.rateLimit.delete({
      where: { key },
    });
  } catch {
    // ignore if record doesn't exist
  }
}

