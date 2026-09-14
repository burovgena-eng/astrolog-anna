import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateHoroscopeText, HOROSCOPE_FOCUS, type HoroscopeFocus } from "@/lib/ai-content";
import { getMoonInfo, sunSignForDate } from "@/lib/moon";
import { compareDateKeys, nskNow } from "@/lib/schedule";

/**
 * Task 25: персональный AI-прогноз.
 * POST /api/horoscope { name?, birthDate: YYYY-MM-DD, birthTime?: HH:mm, focus }
 *
 * Защита: rate limit 10/мин на IP. Дорогой вызов LLM кэшируется в БД
 * по хэшу (имя+дата+время+фокус+сегодняшняя дата) — повторные запросы
 * в тот же день мгновенны и бесплатны.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

function validDate(iso: string): boolean {
  if (!DATE_RE.test(iso)) return false;
  const [y, m, d] = iso.split("-").map(Number);
  // Round-trip: отсекаем несуществующие даты вроде «2026-02-30»
  const roundTrip = new Date(Date.UTC(y, m - 1, d));
  if (
    roundTrip.getUTCFullYear() !== y ||
    roundTrip.getUTCMonth() !== m - 1 ||
    roundTrip.getUTCDate() !== d
  ) {
    return false;
  }
  if (y < 1900) return false;
  // Дата рождения не может быть в будущем (по НСК)
  return compareDateKeys(iso, nskNow().dateKey) <= 0;
}

export async function POST(request: NextRequest) {
  if (!rateLimit(`horoscope:${getClientIp(request)}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Слишком много запросов. Подождите минуту." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const name =
    typeof body.name === "string" && body.name.trim() !== ""
      ? body.name.trim().slice(0, 40)
      : null;
  const birthDate =
    typeof body.birthDate === "string" ? body.birthDate.trim() : "";
  const birthTimeRaw =
    typeof body.birthTime === "string" && body.birthTime.trim() !== ""
      ? body.birthTime.trim()
      : null;
  const focusRaw = typeof body.focus === "string" ? body.focus : "";
  // Object.hasOwn — чтобы «constructor»/«toString» из цепочки прототипов не проходили валидацию
  if (typeof focusRaw !== "string" || !Object.hasOwn(HOROSCOPE_FOCUS, focusRaw)) {
    return NextResponse.json(
      { error: "Выберите фокус прогноза" },
      { status: 400 }
    );
  }
  const focus = focusRaw as HoroscopeFocus;

  if (!validDate(birthDate)) {
    return NextResponse.json(
      { error: "Укажите корректную дату рождения (ГГГГ-ММ-ДД)" },
      { status: 400 }
    );
  }
  if (birthTimeRaw && !TIME_RE.test(birthTimeRaw)) {
    return NextResponse.json(
      { error: "Время рождения — в формате ЧЧ:ММ" },
      { status: 400 }
    );
  }
  const birthTime = birthTimeRaw && TIME_RE.test(birthTimeRaw) ? birthTimeRaw : null;

  const birth = new Date(`${birthDate}T12:00:00Z`);
  const sun = sunSignForDate(birth);
  const now = new Date();
  // Кэш «на день» — по календарному дню Новосибирска, как весь остальной сайт
  const dateKey = nskNow(now).dateKey;
  const moon = getMoonInfo(now);

  const hash = createHash("sha256")
    .update(
      [name ?? "", birthDate, birthTime ?? "", focus, dateKey].join("|")
    )
    .digest("hex");

  // 1) Кэш за сегодня
  try {
    const cached = await db.horoscopeCache.findUnique({ where: { hash } });
    if (cached) {
      return NextResponse.json(
        {
          text: cached.text,
          sunSign: { name: sun.name, symbol: sun.symbol },
          moon: {
            phaseName: moon.phaseName,
            illumination: moon.illumination,
            lunarDay: moon.lunarDay,
            zodiacName: moon.zodiac.name,
            zodiacSymbol: moon.zodiac.symbol,
          },
          cached: true,
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
  } catch {
    // кэш не критичен — идём генерировать
  }

  // 2) Генерация
  try {
    const text = await generateHoroscopeText({
      name,
      birthDate,
      birthTime,
      focus,
      sunSignName: sun.name,
      sunSignSymbol: sun.symbol,
      moon: {
        phaseName: moon.phaseName,
        illumination: moon.illumination,
        lunarDay: moon.lunarDay,
        waxing: moon.waxing,
        zodiac: moon.zodiac,
      },
    });

    // 3) Сохраняем в кэш (не валим ответ, если не сохранилось)
    try {
      await db.horoscopeCache.create({
        data: {
          hash,
          name,
          birthDate,
          focus,
          dateKey,
          sunSign: sun.name,
          text,
        },
      });
    } catch {
      /* повторный хэш за день — уже закэширован параллельным запросом */
    }

    return NextResponse.json(
      {
        text,
        sunSign: { name: sun.name, symbol: sun.symbol },
        moon: {
          phaseName: moon.phaseName,
          illumination: moon.illumination,
          lunarDay: moon.lunarDay,
          zodiacName: moon.zodiac.name,
          zodiacSymbol: moon.zodiac.symbol,
        },
        cached: false,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[horoscope]", err);
    return NextResponse.json(
      { error: "Не удалось составить прогноз. Попробуйте ещё раз." },
      { status: 502 }
    );
  }
}
