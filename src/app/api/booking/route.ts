import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cleanupRateLimit, getClientIp, rateLimit } from "@/lib/rate-limit";
import {
  addDays,
  compareDateKeys,
  formatSlotRu,
  isValidDateKey,
  isValidTime,
  nskNow,
  nskPartsToDate,
  slotTimesFor,
  LEAD_MINUTES,
  MAX_DAYS_AHEAD,
} from "@/lib/schedule";

/** Валидная дата → ISO; мусор → «По договорённости» (раньше падал 500). */
function parseDatetime(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "По договорённости";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "По договорённости" : d.toISOString();
}

type SlotValidation =
  | { ok: true; slotAt: Date; datetimeRu: string }
  | { ok: false; error: string; status: number };

/** Task 27: проверка выбранного слота (формат, окно календаря, рабочее время, запас 2 ч). */
function validateSlot(slot: unknown): SlotValidation | null {
  if (slot === undefined || slot === null) return null;
  if (typeof slot !== "object") return { ok: false, error: "Неверный формат слота", status: 400 };
  const { date, time } = slot as { date?: unknown; time?: unknown };
  if (!isValidDateKey(date) || !isValidTime(time)) {
    return { ok: false, error: "Неверные дата или время слота", status: 400 };
  }
  // Время — строго из сетки расписания этого дня (белый список)
  if (!slotTimesFor(date).includes(time)) {
    return { ok: false, error: "В этот день приёма нет — выберите другой день", status: 400 };
  }
  const { dateKey: today } = nskNow();
  if (compareDateKeys(date, today) < 0 || compareDateKeys(date, addDays(today, MAX_DAYS_AHEAD)) > 0) {
    return { ok: false, error: "Эта дата вне открытого календаря", status: 400 };
  }
  const slotAt = nskPartsToDate(date, time);
  if (slotAt.getTime() <= Date.now() + LEAD_MINUTES * 60_000) {
    return {
      ok: false,
      error: "Это время уже скоро наступит — выберите слот минимум через 2 часа",
      status: 400,
    };
  }
  return { ok: true, slotAt, datetimeRu: formatSlotRu(date, time) };
}

export async function POST(request: NextRequest) {
  // Не более 5 заявок в минуту с одного IP (защита от спама)
  const ip = getClientIp(request);
  cleanupRateLimit();
  if (!rateLimit(`booking:${ip}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "Слишком много заявок подряд. Попробуйте через минуту." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { name, contact, comment } = body;

    if (!name || typeof name !== "string" || !contact || typeof contact !== "string") {
      return NextResponse.json(
        { error: "Заполните все обязательные поля" },
        { status: 400 }
      );
    }

    const slot = validateSlot(body.slot);
    if (slot && !slot.ok) {
      return NextResponse.json({ error: slot.error }, { status: slot.status });
    }

    // datetime: приоритет у человекочитаемого слота, иначе старое поведение
    const datetime = slot && slot.ok ? slot.datetimeRu : parseDatetime(body.datetime);

    const data = {
      name: name.trim().slice(0, 200),
      contact: contact.trim().slice(0, 200),
      service: typeof body.service === "string" && body.service ? body.service.slice(0, 200) : "Не указана (форма на сайте)",
      datetime,
      comment: typeof comment === "string" && comment ? comment.slice(0, 2000) : null,
      slotAt: slot && slot.ok ? slot.slotAt : null,
    };

    // Слот бронируем атомарно: повторная проверка занятости внутри транзакции
    const created = await db.$transaction(async (tx) => {
      if (slot && slot.ok) {
        const taken = await tx.booking.findFirst({
          where: { slotAt: slot.slotAt, status: { in: ["new", "confirmed"] } },
          select: { id: true },
        });
        if (taken) return null; // двойная бронь
      }
      return tx.booking.create({ data });
    });

    if (!created) {
      return NextResponse.json(
        { error: "Кто-то только что занял это время. Выберите другой слот.", conflict: true },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      id: created.id,
      message: "Заявка успешно отправлена! Мы свяжемся с вами для подтверждения.",
    });
  } catch {
    return NextResponse.json(
      { error: "Произошла ошибка при отправке заявки" },
      { status: 500 }
    );
  }
}
