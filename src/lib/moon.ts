/* ============================================================================
 * Астрономический расчёт Луны — чистый TypeScript, без внешних библиотек.
 *
 * Источники алгоритмов:
 *  - Jean Meeus, "Astronomical Algorithms", 2nd ed.:
 *      гл. 25 — низкоточная долгота Солнца;
 *      гл. 47 — ряды для долготы Луны (точность ~0.3°, этого достаточно
 *              для фазы и лунного знака зодиака);
 *      гл. 49 — средние моменты новолуний/полнолуний + главные периодические
 *              поправки (точность ~1–2 минуты).
 *  - Astronomical Almanac, low-precision formulas (гл. «Page D22»).
 *
 * Все моменты времени — обычные JS Date (UTC-инстанты); отображение —
 * в локальной таймзоне браузера средствами toLocaleDateString.
 * ========================================================================== */

/* ----------------------------- Константы --------------------------------- */

const DEG = Math.PI / 180;
const SYNODIC_MONTH = 29.530588861; // средний синодический месяц, суток (Meeus)
const J2000 = 2451545.0; // юлианская дата эпохи 2000-01-01 12:00 TT

/** Нормализация угла в диапазон [0, 360). */
function norm360(deg: number): number {
  const r = deg % 360;
  return r < 0 ? r + 360 : r;
}

/** Синус/косинус угла, заданного в градусах. */
const sinD = (deg: number): number => Math.sin(deg * DEG);

/** Unix-время → юлианская дата. */
export function julianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

/** Юлианская дата → Date. */
export function fromJulianDay(jd: number): Date {
  return new Date(Math.round((jd - 2440587.5) * 86400000));
}

/* -------------------- Долготы Солнца и Луны (гл. 25, 47) ------------------ */

/** Геоцентрическая видимая долгота Солнца, градусы (низкая точность, ~0.01°). */
export function sunLongitude(d: number): number {
  const M = norm360(357.529 + 0.98560028 * d); // средняя аномалия Солнца
  const L = 280.459 + 0.98564736 * d + 1.915 * sinD(M) + 0.02 * sinD(2 * M);
  return norm360(L);
}

/** Геоцентрическая видимая долгота Луны, градусы (ряды гл. 47, ~0.3°). */
export function moonLongitude(d: number): number {
  const D = norm360(297.8502 + 12.19074912 * d); // средняя элонгация
  const M = norm360(357.5291 + 0.98560028 * d); // средняя аномалия Солнца
  const Mp = norm360(134.9634 + 13.06499295 * d); // средняя аномалия Луны
  const F = norm360(93.2721 + 13.22935024 * d); // аргумент широты

  const lambda =
    218.316 +
    13.17639648 * d +
    6.289 * sinD(Mp) +
    1.274 * sinD(2 * D - Mp) +
    0.658 * sinD(2 * D) +
    0.214 * sinD(2 * Mp) -
    0.186 * sinD(M) -
    0.114 * sinD(2 * F) -
    0.059 * sinD(2 * D - 2 * Mp) -
    0.057 * sinD(2 * D - Mp - M) +
    0.053 * sinD(2 * D + Mp) +
    0.046 * sinD(2 * D - M) -
    0.041 * sinD(Mp - M) -
    0.035 * sinD(D) -
    0.031 * sinD(Mp + M);

  return norm360(lambda);
}

/* --------------------- Фаза, освещённость, лунный день -------------------- */

export interface MoonZodiac {
  name: string; // именительный: «Рыбы»
  genitive: string; // «Луна в знаке Рыб»
  symbol: string; // ♓
}

const MOON_ZODIAC: MoonZodiac[] = [
  { name: 'Овен', genitive: 'Овна', symbol: '♈' },
  { name: 'Телец', genitive: 'Тельца', symbol: '♉' },
  { name: 'Близнецы', genitive: 'Близнецов', symbol: '♊' },
  { name: 'Рак', genitive: 'Рака', symbol: '♋' },
  { name: 'Лев', genitive: 'Льва', symbol: '♌' },
  { name: 'Дева', genitive: 'Девы', symbol: '♍' },
  { name: 'Весы', genitive: 'Весов', symbol: '♎' },
  { name: 'Скорпион', genitive: 'Скорпиона', symbol: '♏' },
  { name: 'Стрелец', genitive: 'Стрельца', symbol: '♐' },
  { name: 'Козерог', genitive: 'Козерога', symbol: '♑' },
  { name: 'Водолей', genitive: 'Водолея', symbol: '♒' },
  { name: 'Рыбы', genitive: 'Рыб', symbol: '♓' },
];

/** Знак зодиака, в котором находится Луна при данной долготе. */
export function moonZodiacSign(longitudeDeg: number): MoonZodiac {
  const idx = Math.floor(norm360(longitudeDeg) / 30) % 12;
  return MOON_ZODIAC[idx];
}

/* ----------------- Солнечный знак зодиака (по дате рождения) ---------------- */

/**
 * Солнечный знак по календарной дате (границы — общепринятые, без учёта
 * точного положения Солнца; на стыках ~19–23 числа знак меняется).
 */
export function sunSignForDate(date: Date): MoonZodiac {
  const m = date.getUTCMonth() + 1; // 1..12
  const d = date.getUTCDate();
  // [месяц, день] — начало каждого знака
  const starts: [number, number][] = [
    [1, 20], // Водолей
    [2, 19], // Рыбы
    [3, 21], // Овен
    [4, 20], // Телец
    [5, 21], // Близнецы
    [6, 21], // Рак
    [7, 23], // Лев
    [8, 23], // Дева
    [9, 23], // Весы
    [10, 23], // Скорпион
    [11, 22], // Стрелец
    [12, 22], // Козерог
  ];
  // индекс знака: signOrder[i] — знак, который начинается с даты starts[i]
  const signOrder = [10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; // MOON_ZODIAC индексы
  let idx = 9; // Козерог по умолчанию (до 20.01 / после 22.12)
  for (let i = 0; i < starts.length; i++) {
    const [sm, sd] = starts[i];
    // граница наступила → действующий знак = signOrder[i]
    if (m > sm || (m === sm && d >= sd)) idx = signOrder[i];
  }
  return MOON_ZODIAC[idx];
}

export interface MoonInfo {
  /** Доля синодического цикла 0..1 (0 — новолуние, 0.5 — полнолуние). */
  phaseFraction: number;
  /** Индекс фазы 0..7 (0 новолуние → 4 полнолуние → 7 убывающий серп). */
  phaseIndex: number;
  /** Доля освещённого диска 0..1 (фаза угла освещения). */
  illumination: number;
  /** Возраст Луны в сутках от новолуния. */
  age: number;
  /** Лунный день 1..30 (астрологическая конвенция). */
  lunarDay: number;
  /** Луна растёт? */
  waxing: boolean;
  /** Видимая долгота Луны, градусы. */
  longitude: number;
  /** Элонгация Луны от Солнца, градусы 0..360. */
  elongation: number;
  /** Лунный знак зодиака. */
  zodiac: MoonZodiac;
  /** Название фазы и совет — заполняются из PHASE_TEXTS. */
  phaseName: string;
  advice: string;
}

export const PHASE_TEXTS: { name: string; advice: string }[] = [
  {
    name: 'Новолуние',
    advice:
      'Время тишины и новых намерений: планируйте, мечтайте и закладывайте фундамент будущего. Не торопите события — энергия цикла только набирает силу.',
  },
  {
    name: 'Растущий серп',
    advice:
      'Энергия начинает набирать ход — делайте первые шаги к задуманному. Действуйте понемногу, но каждый день, и Луна усилит ваш замысел.',
  },
  {
    name: 'Первая четверть',
    advice:
      'Точка выбора: могут появиться первые препятствия и сомнения. Не отказывайтесь от цели — гибкость и упорство проведут вас дальше.',
  },
  {
    name: 'Растущая Луна',
    advice:
      'Пик силы для дел, общения и свершений. Всё, во что вы вкладываете энергию сейчас, растёт вместе с Луной.',
  },
  {
    name: 'Полнолуние',
    advice:
      'Пик энергии: эмоции обострены, а результаты — на виду. Благодарите за достигнутое и мягко отпускайте то, что изжило себя.',
  },
  {
    name: 'Убывающая Луна',
    advice:
      'Время подведения итогов и освобождения. Завершайте начатое, раздайте долги и позвольте лишнему уйти из вашей жизни.',
  },
  {
    name: 'Последняя четверть',
    advice:
      'Энергия идёт на спад — дайте себе право на отдых. Наведите порядок в делах и мыслях, чтобы новый цикл застал вас в чистоте.',
  },
  {
    name: 'Убывающий серп',
    advice:
      'Тишина перед новым началом. Отпустите старое с благодарностью — скоро наступит новолуние, и можно будет загадать новые намерения.',
  },
];

/**
 * Полный расчёт состояния Луны на момент `date`.
 * Элонгация (истинный угол Луна—Солнце по долготе) даёт и фазу, и долю
 * освещённого диска — согласованно, без двух независимых моделей.
 */
export function getMoonInfo(date: Date): MoonInfo {
  const d = julianDay(date) - J2000;

  const lambdaSun = sunLongitude(d);
  const lambdaMoon = moonLongitude(d);
  const elongation = norm360(lambdaMoon - lambdaSun);

  const phaseFraction = elongation / 360;
  const illumination = (1 - Math.cos(elongation * DEG)) / 2;
  const waxing = elongation < 180;
  const age = phaseFraction * SYNODIC_MONTH;
  const lunarDay = Math.min(30, Math.max(1, Math.floor((phaseFraction * 30) + 1e-9) + 1));

  // 8 фаз: границы каждые 45° элонгации (±22.5° вокруг ключевых точек)
  const phaseIndex = Math.floor((elongation + 22.5) / 45) % 8;
  const text = PHASE_TEXTS[phaseIndex];

  return {
    phaseFraction,
    phaseIndex,
    illumination,
    age,
    lunarDay,
    waxing,
    longitude: lambdaMoon,
    elongation,
    zodiac: moonZodiacSign(lambdaMoon),
    phaseName: text.name,
    advice: text.advice,
  };
}

/* ----------- Моменты новолуний и полнолуний (Meeus, гл. 49) --------------- */

/** Главная (k-я) фаза: 0 — новолуние, 0.5 — полнолуние. */
function meanPhaseJDE(k: number, fraction: number): number {
  const kk = k + fraction;
  const T = kk / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;

  const jde =
    2451550.09766 +
    SYNODIC_MONTH * kk +
    0.00015437 * T2 -
    0.00000015 * T3 +
    0.00000000073 * T3 * T;

  return jde;
}

/** Периодические поправки (дни) для новолуния/полнолуния, Meeus табл. 49.A/49.B. */
function phaseCorrections(k: number, isNew: boolean): number {
  const kk = k;
  const T = kk / 1236.85;
  const T2 = T * T;
  const E = 1 - 0.002516 * T - 0.0000074 * T2;

  const M = norm360(2.5534 + 29.1053567 * kk - 0.0000014 * T2 - 0.00000011 * T2 * T);
  const Mp = norm360(201.5643 + 385.81693528 * kk + 0.0107582 * T2 + 0.00001238 * T2 * T - 0.000000058 * T2 * T * T);
  const F = norm360(160.7108 + 390.67050284 * kk - 0.0016118 * T2 - 0.00000227 * T2 * T + 0.000000011 * T2 * T * T);
  const Om = norm360(124.7746 - 1.56375588 * kk + 0.0020672 * T2 + 0.00000215 * T2 * T);

  const s = sinD;
  const c1 = isNew ? -0.4072 : -0.40614; // sin M'
  const c2 = isNew ? 0.17241 : 0.17302; // E sin M

  return (
    c1 * s(Mp) +
    c2 * E * s(M) +
    0.01608 * s(2 * Mp) +
    0.01039 * s(2 * F) +
    0.00739 * E * s(Mp - M) -
    0.00514 * E * s(Mp + M) +
    0.00208 * E * E * s(2 * M) -
    0.00111 * s(Mp - 2 * F) -
    0.00057 * s(Mp + 2 * F) +
    0.00056 * E * s(2 * Mp + M) -
    0.00042 * s(3 * Mp) +
    0.00042 * E * s(M + 2 * F) +
    0.00038 * E * s(M - 2 * F) -
    0.00024 * E * s(2 * Mp - M) -
    0.00017 * s(Om) -
    0.00007 * s(Mp + 2 * M)
  );
}

/** JDE k-го новолуния (fraction=0) или полнолуния (fraction=0.5). */
function phaseJDE(k: number, fraction: 0 | 0.5): number {
  return meanPhaseJDE(k, fraction) + phaseCorrections(k + fraction, fraction === 0);
}

/** Номер k фазы, ближайшей ПОСЛЕ указанной юлианской даты. */
function nextPhaseK(jd: number, fraction: 0 | 0.5): number {
  const approxK = (jd - 2451550.09766) / SYNODIC_MONTH - fraction;
  return Math.ceil(approxK);
}

/** Ближайшее новолуние после `after` (±2 мин). */
export function nextNewMoon(after: Date): Date {
  const k = nextPhaseK(julianDay(after), 0);
  const jde = phaseJDE(k, 0);
  const result = fromJulianDay(jde);
  return result.getTime() <= after.getTime() ? fromJulianDay(phaseJDE(k + 1, 0)) : result;
}

/** Ближайшее полнолуние после `after` (±2 мин). */
export function nextFullMoon(after: Date): Date {
  const k = nextPhaseK(julianDay(after), 0.5);
  const jde = phaseJDE(k, 0.5);
  const result = fromJulianDay(jde);
  return result.getTime() <= after.getTime() ? fromJulianDay(phaseJDE(k + 1, 0.5)) : result;
}

/* ---------------------- Лунная неделя для календаря ----------------------- */

/** Полоса лунного календаря: `days` дней, начиная с `start` (полдень локального дня). */
export function getMoonWeek(start: Date, days = 7): (MoonInfo & { date: Date })[] {
  const week: (MoonInfo & { date: Date })[] = [];
  for (let i = 0; i < days; i++) {
    const noon = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, 12, 0, 0);
    week.push({ ...getMoonInfo(noon), date: noon });
  }
  return week;
}

/** Сколько целых суток осталось до события. */
export function daysUntil(from: Date, to: Date): number {
  return Math.max(0, Math.ceil((to.getTime() - from.getTime()) / 86400000));
}
