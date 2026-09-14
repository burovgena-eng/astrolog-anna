/**
 * Task 27: расписание приёма и слоты записи.
 *
 * Анна принимает онлайн из Новосибирска: Asia/Novosibirsk, постоянный UTC+7
 * (с 2016 года без перехода на летнее время), поэтому арифметика ведётся
 * в «новосибирских» календарных ключах `YYYY-MM-DD` поверх Date.UTC.
 * Все функции чистые — используются и на сервере (API), и на клиенте (календарь).
 */

/** Смещение Новосибирска от UTC, минут (+7 ч). */
export const NSK_OFFSET_MIN = 420;

/** Длительность одного окна, минут. */
export const SLOT_MINUTES = 60;

/** Начало приёма, минут от полуночи (10:00). */
export const DAY_START_MIN = 10 * 60;

/** Конец приёма, минут от полуночи (19:00) — последний старт окна 18:00. */
export const DAY_END_MIN = 19 * 60;

/** Минимальный запас до начала консультации (нельзя записаться позже чем за 2 часа). */
export const LEAD_MINUTES = 120;

/** На сколько дней вперёд открыт календарь. */
export const MAX_DAYS_AHEAD = 45;

/** Подпись часового пояса для интерфейса. */
export const TZ_LABEL = "Новосибирск (UTC+7)";

/** Краткое описание графика для интерфейса. */
export const SCHEDULE_LABEL = "Пн–Сб · 10:00–19:00";

const MONTHS_GEN = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

const MONTHS_NOM = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

/** Пн..Вс для сетки календаря (начало недели — понедельник). */
export const WEEKDAYS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Текущее время по Новосибирску: календарный ключ даты и минуты от полуночи. */
export function nskNow(now: Date = new Date()): { dateKey: string; minutes: number } {
  const shifted = new Date(now.getTime() + NSK_OFFSET_MIN * 60_000);
  return {
    dateKey: `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(shifted.getUTCDate())}`,
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}

/** Строгая проверка ключа даты `YYYY-MM-DD` (включая реальность даты). */
export function isValidDateKey(s: unknown): s is string {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1) return false;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return d <= daysInMonth;
}

/** День недели ключа даты: 0 = воскресенье … 6 = суббота. */
export function weekdayOf(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Ключ даты + n дней (арифметика на UTC, без локали). */
export function addDays(dateKey: string, n: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad2(t.getUTCMonth() + 1)}-${pad2(t.getUTCDate())}`;
}

/** Лексикографическое сравнение ключей дат (a < b → -1 и т.д.). */
export function compareDateKeys(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Рабочий ли день: Пн–Сб, воскресенье — выходной. */
export function isWorkingDateKey(dateKey: string): boolean {
  const wd = weekdayOf(dateKey);
  return wd >= 1 && wd <= 6;
}

/** Времена старта окон на дату: "10:00", "11:00" … "18:00"; выходной → []. */
export function slotTimesFor(dateKey: string): string[] {
  if (!isWorkingDateKey(dateKey)) return [];
  const out: string[] = [];
  for (let min = DAY_START_MIN; min + SLOT_MINUTES <= DAY_END_MIN; min += SLOT_MINUTES) {
    out.push(`${pad2(Math.floor(min / 60))}:${pad2(min % 60)}`);
  }
  return out;
}

/** НСК-дата + время → реальный UTC-момент (уходит в Prisma DateTime). */
export function nskPartsToDate(dateKey: string, time: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, h, min, 0, 0) - NSK_OFFSET_MIN * 60_000);
}

/** Строгая проверка времени `HH:mm`. */
export function isValidTime(s: unknown): s is string {
  return typeof s === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

/** «2026-11-15» + «14:00» → «сб, 15 ноября, 14:00 (НСК)» — для карточки в CRM. */
export function formatSlotRu(dateKey: string, time: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const wd = weekdayOf(dateKey);
  const wdRu = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"][wd];
  return `${wdRu}, ${d} ${MONTHS_GEN[m - 1]} ${y}, ${time} (НСК)`;
}

/** «2026-11» → «Ноябрь 2026» — заголовок календаря. */
export function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return `${MONTHS_NOM[m - 1]} ${y}`;
}

/** Ключ текущего месяца по НСК: «YYYY-MM». */
export function nskMonthKey(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() + NSK_OFFSET_MIN * 60_000);
  return `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}`;
}

/** Следующий месяц: «2026-12» → «2027-01». */
export function nextMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${pad2(m + 1)}`;
}

/** Предыдущий месяц: «2026-01» → «2025-12». */
export function prevMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${pad2(m - 1)}`;
}

/** Проверка ключа месяца «YYYY-MM». */
export function isValidMonthKey(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
}
