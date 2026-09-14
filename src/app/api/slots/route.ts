import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cleanupRateLimit, getClientIp, rateLimit } from "@/lib/rate-limit";
import {
  addDays,
  compareDateKeys,
  isValidMonthKey,
  nskNow,
  nskPartsToDate,
  slotTimesFor,
  TZ_LABEL,
  LEAD_MINUTES,
  MAX_DAYS_AHEAD,
} from "@/lib/schedule";

/**
 * Task 27: занятость слотов на месяц.
 * GET /api/slots?month=YYYY-MM
 * → { today, maxDate, tzLabel, days: { "YYYY-MM-DD": [{ time, available }] } }
 * В days попадают только рабочие (Пн–Сб) дни в диапазоне [сегодня … сегодня+45].
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  cleanupRateLimit();
  if (!rateLimit(`slots:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "Слишком много запросов" }, { status: 429 });
  }

  const monthParam = request.nextUrl.searchParams.get("month");
  if (!isValidMonthKey(monthParam)) {
    return NextResponse.json({ error: "Неверный месяц (нужен YYYY-MM)" }, { status: 400 });
  }
  const month = monthParam;

  const now = new Date();
  const { dateKey: today } = nskNow(now);
  const maxDate = addDays(today, MAX_DAYS_AHEAD);
  const maxMonth = maxDate.slice(0, 7);

  // Месяц должен пересекаться с окном записи [today … maxDate]
  if (compareDateKeys(month, today.slice(0, 7)) < 0 || compareDateKeys(month, maxMonth) > 0) {
    return NextResponse.json(
      { error: `Календарь открыт на период ${today} — ${maxDate}` },
      { status: 400 }
    );
  }

  // Границы месяца в UTC (новосибирская полночь 1-го числа)
  const monthStart = nskPartsToDate(`${month}-01`, "00:00");
  const [y, m] = month.split("-").map(Number);
  const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const nextMonthStart = nskPartsToDate(`${nextMonth}-01`, "00:00");

  try {
    const booked = await db.booking.findMany({
      where: {
        slotAt: { gte: monthStart, lt: nextMonthStart },
        status: { in: ["new", "confirmed"] },
      },
      select: { slotAt: true },
    });
    const takenKeys = new Set(booked.map((b) => b.slotAt!.getTime()));

    const leadMs = now.getTime() + LEAD_MINUTES * 60_000;
    const days: Record<string, { time: string; available: boolean }[]> = {};

    let cursor = compareDateKeys(today, `${month}-01`) > 0 ? today : `${month}-01`;
    const lastDay = month === maxMonth ? maxDate : lastDayOf(month);
    while (compareDateKeys(cursor, lastDay) <= 0) {
      const times = slotTimesFor(cursor);
      if (times.length > 0) {
        days[cursor] = times.map((time) => {
          const startUtc = nskPartsToDate(cursor, time);
          const inFuture = startUtc.getTime() > leadMs;
          return { time, available: inFuture && !takenKeys.has(startUtc.getTime()) };
        });
      }
      cursor = addDays(cursor, 1);
    }

    return NextResponse.json(
      { today, maxDate, tzLabel: TZ_LABEL, days },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "Не удалось получить расписание" }, { status: 500 });
  }
}

/** Последний день месяца в виде ключа даты. */
function lastDayOf(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${monthKey}-${String(d).padStart(2, "0")}`;
}
