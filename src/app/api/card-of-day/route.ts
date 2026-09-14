import { NextRequest, NextResponse } from "next/server";
import { getCardForDate, todayDateKey } from "@/lib/tarot-data";

/**
 * Карта дня: детерминирована по дате — за день карта не меняется.
 * Опциональный ?date=YYYY-MM-DD (для тестов/отладки), иначе — серверная дата.
 */
export async function GET(request: NextRequest) {
  try {
    const requested = request.nextUrl.searchParams.get("date");
    const dateKey =
      requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : todayDateKey();
    const card = getCardForDate(dateKey);
    return NextResponse.json({ ...card, date: dateKey });
  } catch {
    return NextResponse.json(
      { error: "Не удалось получить карту дня" },
      { status: 500 }
    );
  }
}
