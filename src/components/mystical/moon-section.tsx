'use client';

import { useId, useMemo, useState, useSyncExternalStore, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  getMoonInfo,
  getMoonWeek,
  nextNewMoon,
  nextFullMoon,
  daysUntil,
} from '@/lib/moon';

/* ================= ZODIAC DATA ================= */

type Element = 'Огонь' | 'Земля' | 'Воздух' | 'Вода';

interface ZodiacSign {
  name: string;
  symbol: string;
  element: Element;
  untilMonth: number; // sign is active up to this day (inclusive)
  untilDay: number;
  description: string;
}

const ZODIAC_SIGNS: ZodiacSign[] = [
  {
    name: 'Козерог', symbol: '♑', element: 'Земля', untilMonth: 1, untilDay: 19,
    description: 'Целеустремлённость и внутренний стержень. Вы строите жизнь фундаментально и достигаете вершин терпением и дисциплиной.',
  },
  {
    name: 'Водолей', symbol: '♒', element: 'Воздух', untilMonth: 2, untilDay: 18,
    description: 'Свободомыслящий новатор. Вы видите будущее раньше других, цените независимость и дружбу без границ.',
  },
  {
    name: 'Рыбы', symbol: '♓', element: 'Вода', untilMonth: 3, untilDay: 20,
    description: 'Тонкая настройка на мир: ваша эмпатия и воображение — настоящие мистические дары. Берегите их и доверяйте снам.',
  },
  {
    name: 'Овен', symbol: '♈', element: 'Огонь', untilMonth: 4, untilDay: 19,
    description: 'Энергия первопроходца: вы быстро загораетесь идеями и ведёте за собой. Ваша сила — честность и смелость начинать первым.',
  },
  {
    name: 'Телец', symbol: '♉', element: 'Земля', untilMonth: 5, untilDay: 20,
    description: 'Воплощение стабильности и вкуса. Вы умеете создавать комфорт, цените надёжность и доводите начатое до конца.',
  },
  {
    name: 'Близнецы', symbol: '♊', element: 'Воздух', untilMonth: 6, untilDay: 20,
    description: 'Живой ум и лёгкость общения — ваш талант. Вы быстро учитесь и находите общий язык с кем угодно, не терпя скуки.',
  },
  {
    name: 'Рак', symbol: '♋', element: 'Вода', untilMonth: 7, untilDay: 22,
    description: 'Глубокая интуиция и чуткое сердце. Вы заботитесь о близких и чувствуете людей без слов — доверяйте этому дару.',
  },
  {
    name: 'Лев', symbol: '♌', element: 'Огонь', untilMonth: 8, untilDay: 22,
    description: 'Природное обаяние и щедрость королевской особы. Вы умеете вдохновлять — направляйте свой свет и на тех, кто рядом.',
  },
  {
    name: 'Дева', symbol: '♍', element: 'Земля', untilMonth: 9, untilDay: 22,
    description: 'Внимание к деталям и желание приносить пользу. Ваш аналитический ум превращает хаос в порядок, а заботу — в дела.',
  },
  {
    name: 'Весы', symbol: '♎', element: 'Воздух', untilMonth: 10, untilDay: 22,
    description: 'Врождённое чувство гармонии и красоты. Вы — дипломат: видите обе стороны и создаёте вокруг себя равновесие.',
  },
  {
    name: 'Скорпион', symbol: '♏', element: 'Вода', untilMonth: 11, untilDay: 21,
    description: 'Глубина и магнетизм. Вы видите скрытые мотивы, не боитесь трансформаций и выходите из кризисов сильнее.',
  },
  {
    name: 'Стрелец', symbol: '♐', element: 'Огонь', untilMonth: 12, untilDay: 21,
    description: 'Дух странника и философа. Вы верите в лучшее, стремитесь к росту и делитесь оптимизмом со всеми вокруг.',
  },
];

function getZodiacSign(month: number, day: number): ZodiacSign {
  for (const sign of ZODIAC_SIGNS) {
    if (month < sign.untilMonth || (month === sign.untilMonth && day <= sign.untilDay)) {
      return sign;
    }
  }
  return ZODIAC_SIGNS[0]; // 22–31 декабря — Козерог
}

const ELEMENT_STYLES: Record<Element, { color: string; glow: string }> = {
  Огонь: { color: '#f0a24b', glow: 'rgba(240,162,75,0.35)' },
  Земля: { color: '#7fc98f', glow: 'rgba(127,201,143,0.3)' },
  Воздух: { color: '#c4b5fd', glow: 'rgba(196,181,253,0.35)' },
  Вода: { color: '#a78bfa', glow: 'rgba(167,139,250,0.35)' },
};

interface ChineseAnimal {
  name: string;
  genitive: string;
  trait: string;
}

const CHINESE_ANIMALS: ChineseAnimal[] = [
  { name: 'Крыса', genitive: 'Крысы', trait: 'Годы Крысы дарят находчивость и умение выходить из любых обстоятельств победителем.' },
  { name: 'Бык', genitive: 'Быка', trait: 'Год Быка — время терпеливого труда, надёжности и медленного, но верного роста.' },
  { name: 'Тигр', genitive: 'Тигра', trait: 'Год Тигра приносит смелость, страсть и неожиданные повороты судьбы.' },
  { name: 'Кот', genitive: 'Кота', trait: 'Год Кота располагает к осторожности, дипломатии и заботе о доме и близких.' },
  { name: 'Дракон', genitive: 'Дракона', trait: 'Год Дракона — самый яркий: удача, масштаб и сильные эмоции.' },
  { name: 'Змея', genitive: 'Змеи', trait: 'Год Змеи учит мудрости, интуиции и тихой глубокой трансформации.' },
  { name: 'Лошадь', genitive: 'Лошади', trait: 'Год Лошади несёт движение, свободу и жажду перемен.' },
  { name: 'Коза', genitive: 'Козы', trait: 'Год Козы — время творчества, мягкости и внимания к близким.' },
  { name: 'Обезьяна', genitive: 'Обезьяны', trait: 'Год Обезьяны полон остроумных решений, юмора и неожиданных возможностей.' },
  { name: 'Петух', genitive: 'Петуха', trait: 'Год Петуха требует точности, честности и внимания к деталям.' },
  { name: 'Собака', genitive: 'Собаки', trait: 'Год Собаки — про верность, дружбу и справедливость.' },
  { name: 'Свинья', genitive: 'Свиньи', trait: 'Год Свиньи дарит щедрость, достаток и умение наслаждаться жизнью.' },
];

function getChineseAnimal(year: number): ChineseAnimal {
  const index = (((year - 1900) % 12) + 12) % 12;
  return CHINESE_ANIMALS[index];
}

interface ZodiacResult {
  sign: ZodiacSign;
  animal: ChineseAnimal;
  year: number;
}

/* Clock store: ticks once a minute. Client snapshot differs from the server one,
   so React renders the placeholder during SSR and refreshes after hydration. */
function subscribeClock(onStoreChange: () => void) {
  const id = window.setInterval(onStoreChange, 60000);
  return () => window.clearInterval(id);
}
const getMinuteTick = () => Math.floor(Date.now() / 60000);
const getServerMinuteTick = () => 0;

/* ================= MOON VISUAL (SVG, настоящий терминатор) ================= */

/**
 * Диск Луны с реальной геометрией фазы: терминатор — полуэллипс с малой
 * полуосью R·|cos(2π·fraction)|, освещённый лимб справа при росте и слева
 * при убывании. Так выглядит настоящий серп/горб — без сдвигающихся теней.
 */
function MoonPhaseVisual({
  fraction,
  waxing,
  detail = false,
  className = 'w-36 h-36 sm:w-44 sm:h-44',
  ariaLabel,
}: {
  fraction: number; // 0..1 синодического цикла
  waxing: boolean;
  detail?: boolean; // кратеры — только на крупной луне
  className?: string;
  ariaLabel?: string; // задан → role="img" с описанием; нет → aria-hidden
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const cx = 50;
  const cy = 50;
  const R = 48;

  const e = Math.cos(2 * Math.PI * fraction); // 1 у новолуния, −1 у полнолуния
  const rx = Math.max(0.01, Math.min(R - 0.35, Math.abs(e) * R));
  const sweepTerminator = e > 0 ? (waxing ? 0 : 1) : waxing ? 1 : 0;

  const litPath =
    waxing
      ? `M ${cx} ${cy - R} A ${R} ${R} 0 0 1 ${cx} ${cy + R} A ${rx} ${R} 0 0 ${sweepTerminator} ${cx} ${cy - R} Z`
      : `M ${cx} ${cy - R} A ${R} ${R} 0 0 0 ${cx} ${cy + R} A ${rx} ${R} 0 0 ${sweepTerminator} ${cx} ${cy - R} Z`;

  const craters = detail
    ? [
        { x: 38, y: 36, r: 7, o: 0.1 },
        { x: 61, y: 41, r: 5, o: 0.09 },
        { x: 47, y: 62, r: 6.5, o: 0.11 },
        { x: 65, y: 66, r: 4, o: 0.08 },
        { x: 52, y: 29, r: 3.5, o: 0.09 },
        { x: 30, y: 52, r: 4.5, o: 0.08 },
      ]
    : [];

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      <defs>
        <radialGradient id={`surface-${uid}`} cx="35%" cy="32%" r="80%">
          <stop offset="0%" stopColor="#f6f0e2" />
          <stop offset="55%" stopColor="#ddd5c2" />
          <stop offset="100%" stopColor="#b0a68f" />
        </radialGradient>
        <radialGradient id={`night-${uid}`} cx="42%" cy="38%" r="80%">
          <stop offset="0%" stopColor="#14142c" />
          <stop offset="60%" stopColor="#0a0a1a" />
          <stop offset="100%" stopColor="#05050f" />
        </radialGradient>
        <clipPath id={`lit-${uid}`}>
          <path d={litPath} />
        </clipPath>
      </defs>

      {/* Тёмная сторона */}
      <circle cx={cx} cy={cy} r={R} fill={`url(#night-${uid})`} />

      {/* Освещённая часть с настоящим терминатором */}
      <path d={litPath} fill={`url(#surface-${uid})`} />

      {/* Кратеры — только в освещённой зоне */}
      {craters.length > 0 && (
        <g clipPath={`url(#lit-${uid})`}>
          {craters.map((c, i) => (
            <circle key={i} cx={c.x} cy={c.y} r={c.r} fill={`rgba(0,0,0,${c.o})`} />
          ))}
        </g>
      )}

      {/* Тонкий золотой лимб */}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(232,212,139,0.22)" strokeWidth="0.8" />
    </svg>
  );
}

/* ================= SECTION ================= */

export function MoonSection() {
  const [birthDate, setBirthDate] = useState('');
  const [result, setResult] = useState<ZodiacResult | null>(null);

  // Client-only clock, refreshed every minute (no SSR/hydration mismatch).
  const minuteTick = useSyncExternalStore(subscribeClock, getMinuteTick, getServerMinuteTick);
  const now = useMemo(() => (minuteTick > 0 ? new Date() : null), [minuteTick]);
  const moon = useMemo(() => (now ? getMoonInfo(now) : null), [now]);
  const events = useMemo(
    () => (now ? { nextNew: nextNewMoon(now), nextFull: nextFullMoon(now) } : null),
    [now],
  );
  const week = useMemo(() => (now ? getMoonWeek(now, 7) : null), [now]);

  const percent = moon ? Math.round(moon.illumination * 100) : 0;

  const handleZodiacSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parts = birthDate.split('-').map(Number);
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return;
    const [year, month, day] = parts;
    setResult({
      sign: getZodiacSign(month, day),
      animal: getChineseAnimal(year),
      year,
    });
  };

  const elementStyle = result ? ELEMENT_STYLES[result.sign.element] : null;

  return (
    <section id="moon" className="relative py-24 sm:py-32 overflow-hidden" aria-label="Луна сегодня и знак зодиака">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-mystic-gold/5 blur-[120px] rounded-full" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <p className="lux-eyebrow lux-eyebrow-lines">Луна сегодня</p>
          <h2 className="font-[family-name:var(--font-cormorant)] text-3xl sm:text-4xl md:text-5xl font-medium text-gold-foil text-balance mt-5 mb-6">
            Луна сегодня
          </h2>
          <div className="lux-divider max-w-[280px] sm:max-w-xs mx-auto" aria-hidden="true">
            <span />
          </div>
          <p className="text-mystic-text-dim text-base sm:text-lg max-w-xl mx-auto mt-6">
            Лунная энергия влияет на наши дела, эмоции и решения. Узнайте, какая сегодня фаза, и что она вам несёт
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* ===== Left card: moon phase ===== */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <div className="lux-card rounded-2xl p-6 sm:p-8 h-full flex flex-col">
              <p className="text-[11px] uppercase tracking-[0.26em] text-mystic-gold/70 mb-6">
                Энергия ночного светила
              </p>

              {moon && now && events ? (
                <div className="flex flex-col items-center gap-6 flex-1">
                  {/* Диск с реальным терминатором + свечение по освещённости */}
                  <div className="relative w-fit">
                    <div
                      className="absolute -inset-4 rounded-full pointer-events-none"
                      style={{
                        boxShadow: `0 0 ${24 + moon.illumination * 46}px rgba(232,212,139,${0.14 + moon.illumination * 0.32}), 0 0 ${60 + moon.illumination * 60}px rgba(201,168,76,${0.08 + moon.illumination * 0.14})`,
                      }}
                    />
                    <MoonPhaseVisual
                      fraction={moon.phaseFraction}
                      waxing={moon.waxing}
                      detail
                      ariaLabel={`Фаза: ${moon.phaseName}, освещённость ${percent}%, Луна в знаке ${moon.zodiac.genitive}`}
                    />
                  </div>

                  <div className="text-center">
                    <h3 className="font-[family-name:var(--font-cormorant)] text-3xl sm:text-4xl font-medium text-gold-foil mb-1">
                      {moon.phaseName}
                    </h3>
                    <p className="text-mystic-text-dim text-sm">
                      {moon.waxing ? 'Луна растёт — время строить' : 'Луна убывает — время отпускать'}
                    </p>
                  </div>

                  {/* Лунный знак и возраст */}
                  <div className="flex flex-wrap justify-center gap-2">
                    <span
                      className="inline-flex items-center gap-2 rounded-full border border-mystic-gold/20 bg-transparent px-4 py-1.5 text-sm text-mystic-gold"
                      title={`Луна в знаке ${moon.zodiac.genitive}`}
                    >
                      <span className="text-base leading-none" aria-hidden="true">{moon.zodiac.symbol}</span>
                      Луна в знаке {moon.zodiac.genitive}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-mystic-gold/15 bg-transparent px-4 py-1.5 text-sm text-mystic-text-dim">
                      Возраст {moon.age.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} дня
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                    <div className="lux-card rounded-xl p-4 text-center">
                      <p className="lux-numeral text-gold-foil text-3xl sm:text-4xl leading-none">
                        {percent}%
                      </p>
                      <p className="text-mystic-text-dim/70 text-[10px] mt-2 uppercase tracking-[0.22em]">
                        Освещённость
                      </p>
                    </div>
                    <div className="lux-card rounded-xl p-4 text-center">
                      <p className="lux-numeral text-gold-foil text-3xl sm:text-4xl leading-none">
                        {moon.lunarDay}-й
                      </p>
                      <p className="text-mystic-text-dim/70 text-[10px] mt-2 uppercase tracking-[0.22em]">
                        Лунный день
                      </p>
                    </div>
                  </div>

                  <p className="text-mystic-text-dim text-sm sm:text-base leading-relaxed text-center">
                    {moon.advice}
                  </p>

                  {/* Ближайшие события цикла */}
                  <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                    <div className="rounded-xl border border-mystic-gold/10 p-3 flex items-center gap-3">
                      <MoonPhaseVisual fraction={0} waxing={true} className="w-8 h-8 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-widest text-mystic-text-dim/70">
                          Новолуние
                        </p>
                        <p className="text-xs text-mystic-text whitespace-nowrap">
                          {events.nextNew.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'Asia/Novosibirsk' })}
                        </p>
                        <p className="text-[11px] text-mystic-text-dim/70 whitespace-nowrap">
                          {events.nextNew.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Novosibirsk' })}
                          {' · через '}{daysUntil(now, events.nextNew)} дн.
                        </p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-mystic-gold/10 p-3 flex items-center gap-3">
                      <MoonPhaseVisual fraction={0.5} waxing={false} className="w-8 h-8 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-widest text-mystic-text-dim/70">
                          Полнолуние
                        </p>
                        <p className="text-xs text-mystic-text whitespace-nowrap">
                          {events.nextFull.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'Asia/Novosibirsk' })}
                        </p>
                        <p className="text-[11px] text-mystic-text-dim/70 whitespace-nowrap">
                          {events.nextFull.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Novosibirsk' })}
                          {' · через '}{daysUntil(now, events.nextFull)} дн.
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="mt-auto pt-4 text-mystic-text-dim/50 text-xs text-center">
                    Астрономический расчёт на {now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Novosibirsk' })} · время новосибирское (НСК)
                  </p>
                </div>
              ) : (
                /* Pre-mount placeholder */
                <div className="flex-1 flex items-center justify-center py-16">
                  <motion.div
                    animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.85, 0.35] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-32 h-32 rounded-full border border-mystic-gold/20"
                  />
                </div>
              )}
            </div>
          </motion.div>

          {/* ===== Right card: zodiac calculator ===== */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: 0.25 }}
          >
            <div className="lux-card rounded-2xl p-6 sm:p-8 h-full flex flex-col">
              <p className="text-[11px] uppercase tracking-[0.26em] text-mystic-gold/70 mb-6">
                Ваш знак зодиака
              </p>

              <form onSubmit={handleZodiacSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="zodiac-date" className="text-mystic-text">
                    Дата рождения
                  </Label>
                  <Input
                    id="zodiac-date"
                    type="date"
                    required
                    min="1900-01-01"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    style={{ colorScheme: 'dark' }}
                    className="lux-input rounded-lg h-11 px-4 text-mystic-text"
                  />
                </div>
                <Button
                  type="submit"
                  className="lux-btn-gold rounded-full px-8 text-[12px] uppercase tracking-[0.16em] font-semibold h-11"
                >
                  Рассчитать
                </Button>
              </form>

              {result && elementStyle ? (
                <motion.div
                  key={`${result.year}-${result.sign.name}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mt-8 flex flex-col items-center text-center gap-4"
                  aria-live="polite"
                >
                  <span
                    className="text-6xl leading-none"
                    style={{ color: elementStyle.color, textShadow: `0 0 24px ${elementStyle.glow}` }}
                    aria-hidden="true"
                  >
                    {result.sign.symbol}
                  </span>
                  <h3 className="font-[family-name:var(--font-cormorant)] text-3xl font-medium text-gold-foil">
                    {result.sign.name}
                  </h3>
                  <span
                    className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm"
                    style={{
                      borderColor: `${elementStyle.color}66`,
                      color: elementStyle.color,
                      boxShadow: `0 0 18px ${elementStyle.glow}`,
                      background: 'rgba(19,17,24,0.6)',
                    }}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: elementStyle.color }} />
                    Стихия: {result.sign.element}
                  </span>
                  <p className="text-mystic-text-dim text-sm sm:text-base leading-relaxed max-w-md">
                    {result.sign.description}
                  </p>

                  <div className="w-16 h-px bg-gradient-to-r from-transparent via-mystic-gold/50 to-transparent" />

                  <div>
                    <p className="text-xs uppercase tracking-widest text-mystic-gold/60 mb-1">
                      Китайский гороскоп
                    </p>
                    <p className="text-mystic-text text-sm sm:text-base">
                      <span className="lux-numeral text-gold-foil text-lg">{result.year}</span> — год{' '}
                      <span className="text-mystic-gold">{result.animal.genitive}</span>.{' '}
                      <span className="text-mystic-text-dim">{result.animal.trait}</span>
                    </p>
                    <p className="text-mystic-text-dim/50 text-xs mt-2">
                      Год считается по китайскому календарю — он начинается в конце января или феврале.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="mt-8 flex-1 flex items-center justify-center">
                  <p className="text-mystic-text-dim/50 text-sm text-center max-w-xs">
                    Введите дату рождения — и звёзды расскажут, кто вы по знаку зодиака и по китайскому календарю
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ===== Лунный календарь на неделю ===== */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-6 lg:mt-8"
        >
          <div className="lux-card rounded-2xl p-6 sm:p-8">
            <p className="text-[11px] uppercase tracking-[0.26em] text-mystic-gold/70 mb-6 text-center">
              Лунный календарь на неделю
            </p>

            {week ? (
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 -mb-2">
                {week.map((day, i) => (
                  <div
                    key={day.date.toISOString()}
                    className={`flex-1 min-w-[72px] rounded-xl p-3 flex flex-col items-center gap-2 border ${
                      i === 0
                        ? 'border-mystic-gold/30 bg-mystic-gold/[0.05] shadow-[0_0_24px_rgba(201,168,76,0.1)]'
                        : 'border-mystic-gold/[0.08] bg-transparent'
                    }`}
                    aria-label={`${day.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}: ${day.phaseName}, освещённость ${Math.round(day.illumination * 100)}%, Луна в знаке ${day.zodiac.genitive}`}
                  >
                    <p className="text-[11px] uppercase tracking-wider text-mystic-text-dim whitespace-nowrap">
                      {i === 0 ? 'Сегодня' : day.date.toLocaleDateString('ru-RU', { weekday: 'short' })}
                    </p>
                    <p className="text-xs text-mystic-gold/80 whitespace-nowrap">
                      {day.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </p>
                    <MoonPhaseVisual
                      fraction={day.phaseFraction}
                      waxing={day.waxing}
                      className="w-10 h-10"
                    />
                    <p className="lux-numeral text-gold-foil text-base leading-none">
                      {Math.round(day.illumination * 100)}%
                    </p>
                    <span
                      className="text-base leading-none text-mystic-gold/70"
                      title={`Луна в знаке ${day.zodiac.genitive}`}
                      aria-hidden="true"
                    >
                      {day.zodiac.symbol}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              /* Pre-mount placeholder */
              <div className="flex justify-center gap-3 py-4" aria-hidden="true">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="w-10 h-10 rounded-full border border-mystic-gold/10" />
                ))}
              </div>
            )}

            <p className="mt-4 text-mystic-text-dim/40 text-[11px] text-center">
              Освещённость и знак Луны показаны на полдень каждого дня
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
