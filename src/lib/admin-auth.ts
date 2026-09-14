import { createHash, createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

/**
 * Stateless-авторизация админки.
 *
 * Токен = base64url(payload{exp}).base64url(HMAC_SHA256(payload, secret)).
 * Никакого серверного состояния: сессии переживают hot-reload и работают
 * в iframe (панель предпросмотра), где сторонние cookies блокируются —
 * поэтому основной канал передачи токена: Authorization: Bearer (localStorage).
 * HttpOnly-кука остаётся резервным каналом для обычных вкладок.
 */

export const ADMIN_COOKIE = "admin_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 часов

function getSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

/** Сравнение пароля без утечки по времени (хэшируем обе стороны). */
export function checkAdminPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) return false;
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function createSessionToken(): string {
  const payloadB64 = Buffer.from(
    JSON.stringify({ exp: Date.now() + SESSION_TTL_MS })
  ).toString("base64url");
  // Подписываем ИМЕННО base64url-строку payload — в verify сравниваем так же
  const sig = createHmac("sha256", getSessionSecret()).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return false;
  const payloadStr = token.slice(0, idx);
  const sigStr = token.slice(idx + 1);

  try {
    // Подпись сравниваем как строки (их байты) — без повторного декодирования
    const expectedSig = createHmac("sha256", getSessionSecret())
      .update(payloadStr)
      .digest("base64url");
    const a = Buffer.from(expectedSig, "utf8");
    const b = Buffer.from(sigStr, "utf8");
    if (a.length !== b.length) return false;
    if (!timingSafeEqual(a, b)) return false;

    const payload = JSON.parse(Buffer.from(payloadStr, "base64url").toString()) as {
      exp?: number;
    };
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

/** Bearer-заголовок (приоритет) или резервная HttpOnly-кука. */
export function isAdminRequest(request: NextRequest): boolean {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    if (verifySessionToken(auth.slice(7).trim())) return true;
  }
  return verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
}
