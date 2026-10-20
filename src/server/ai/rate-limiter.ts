/**
 * Simple in-memory sliding window rate limiter for Scoped AI requests.
 * Prevents spamming AI calls while remaining lightweight and reliable.
 */
class AiRateLimiter {
  private requests = new Map<string, number[]>();
  private maxRequestsPerWindow = 25;
  private windowMs = 60 * 1000; // 1 minute

  checkRateLimit(userId: string): { allowed: boolean; remaining: number; retryAfterSec?: number } {
    const now = Date.now();
    const timestamps = this.requests.get(userId) || [];

    // Filter out timestamps older than the window
    const recent = timestamps.filter((t) => now - t < this.windowMs);

    if (recent.length >= this.maxRequestsPerWindow) {
      const oldest = recent[0];
      const retryAfterSec = Math.ceil((oldest + this.windowMs - now) / 1000);
      this.requests.set(userId, recent);
      return { allowed: false, remaining: 0, retryAfterSec };
    }

    recent.push(now);
    this.requests.set(userId, recent);
    return {
      allowed: true,
      remaining: this.maxRequestsPerWindow - recent.length,
    };
  }

  reset(userId?: string) {
    if (userId) {
      this.requests.delete(userId);
    } else {
      this.requests.clear();
    }
  }
}

export const aiRateLimiter = new AiRateLimiter();
