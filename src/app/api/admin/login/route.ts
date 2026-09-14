import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, checkAdminPassword, createSessionToken } from "@/lib/admin-auth";
import { cleanupRateLimit, getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Не более 5 попыток входа в минуту с одного IP
  const ip = getClientIp(request);
  cleanupRateLimit();
  if (!rateLimit(`admin-login:${ip}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "Слишком много попыток входа. Подождите минуту." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const password = typeof body?.password === "string" ? body.password : "";

    if (!checkAdminPassword(password)) {
      return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
    }

    const token = createSessionToken();
    const res = NextResponse.json({ success: true, token });
    res.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 8 * 60 * 60,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Ошибка запроса" }, { status: 400 });
  }
}
