/**
 * Простой in-memory rate limiter (окно по времени, по ключу).
 * Достаточно для одного инстанса сервера; не требует внешних сервисов.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * @returns true если запрос разрешён, false если лимит исчерпан
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }
  bucket.count += 1;
  return true;
}

/** IP клиента из прокси-заголовков (шлюз Caddy) с фолбэком. */
export function getClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

/** Защита от безлимитного роста Map: вызывать периодически. */
export function cleanupRateLimit(): void {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }
}
