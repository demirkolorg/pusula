// In-memory token bucket rate limiter (kontrol Kural 51, 73, 147).
//
// Single-instance Node sürecinde çalışır — multi-instance production için
// Redis bazlı versiyon S5'te eklenir. Bu sürüm dev + tek-pod production için
// yeterli (DoS yüzeyini kapatır).
//
// Kullanım:
//   const limit = rateLimit({ tokens: 5, window: 60_000 });
//   if (!limit.tryConsume(ipAdresi)) return new Response("Çok fazla istek", { status: 429 });

type Bucket = {
  tokens: number;
  resetAt: number;
};

type Limiter = {
  tryConsume: (anahtar: string) => boolean;
  reset: (anahtar: string) => void;
};

export type RateLimitOptions = {
  /** Pencere başına token sayısı (örn 5 istek). */
  tokens: number;
  /** Pencere uzunluğu, ms (örn 60_000 = 1 dk). */
  window: number;
};

const limiters = new Map<string, Map<string, Bucket>>();

export function rateLimit(opts: RateLimitOptions, scope = "default"): Limiter {
  let bucketMap = limiters.get(scope);
  if (!bucketMap) {
    bucketMap = new Map();
    limiters.set(scope, bucketMap);
  }
  const map = bucketMap;

  function tryConsume(anahtar: string): boolean {
    const simdi = Date.now();
    const bucket = map.get(anahtar);
    if (!bucket || simdi >= bucket.resetAt) {
      map.set(anahtar, { tokens: opts.tokens - 1, resetAt: simdi + opts.window });
      return true;
    }
    if (bucket.tokens <= 0) return false;
    bucket.tokens -= 1;
    return true;
  }

  function reset(anahtar: string): void {
    map.delete(anahtar);
  }

  return { tryConsume, reset };
}

// Önceden tanımlı limiter'lar — kontrol Kural 73
export const loginLimiter = rateLimit({ tokens: 5, window: 60_000 }, "login");
export const davetLimiter = rateLimit({ tokens: 3, window: 60_000 }, "davet");
export const uploadLimiter = rateLimit({ tokens: 10, window: 60_000 }, "upload");
export const logHataLimiter = rateLimit({ tokens: 30, window: 60_000 }, "log-hata");

/**
 * Periodic cleanup — eski bucket'ları temizle.
 * Production'da ihtiyaç olursa setInterval ile çağırılabilir; dev için pasif.
 */
export function rateLimitCleanup(): void {
  const simdi = Date.now();
  for (const [, bucketMap] of limiters) {
    for (const [anahtar, bucket] of bucketMap) {
      if (bucket.resetAt < simdi) bucketMap.delete(anahtar);
    }
  }
}
