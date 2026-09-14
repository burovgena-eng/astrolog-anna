"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Markdown } from "@/lib/markdown";

/**
 * Task 25: «Персональный прогноз» — AI-гороскоп на реальной астрономии.
 * Ввод: имя (опц.), дата рождения, время (опц.), фокус.
 * Бэкенд: /api/horoscope — солнечный знак + сегодняшняя Луна (moon.ts) → LLM,
 * кэш в БД на день. Показ: чипы знака/Луны + текст с эффектом печати.
 */

const FOCUS_OPTIONS = [
  { key: "love", label: "Любовь", emoji: "💜" },
  { key: "career", label: "Карьера", emoji: "✨" },
  { key: "self", label: "Самопознание", emoji: "🌙" },
] as const;

interface HoroscopeResponse {
  text: string;
  sunSign: { name: string; symbol: string };
  moon: {
    phaseName: string;
    illumination: number;
    lunarDay: number;
    zodiacName: string;
    zodiacSymbol: string;
  };
  cached: boolean;
}

/** Именительный → предложный падеж с предлогом: «Лев» → «во Льве», «Дева» → «в Деве». */
const SIGN_PREP: Record<string, string> = {
  "Овен": "в Овне",
  "Телец": "в Тельце",
  "Близнецы": "в Близнецах",
  "Рак": "в Раке",
  "Лев": "во Льве",
  "Дева": "в Деве",
  "Весы": "в Весах",
  "Скорпион": "в Скорпионе",
  "Стрелец": "в Стрельце",
  "Козерог": "в Козероге",
  "Водолей": "в Водолее",
  "Рыбы": "в Рыбах",
};

function signPrep(name: string): string {
  return SIGN_PREP[name] ?? `в ${name}`;
}

/** Эффект «печатающейся» печати: раскрывает текст порциями (~1.5-2 c). */
function useTypewriter(fullText: string | null): string {
  const [shown, setShown] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (!fullText) return;
    let cancelled = false;
    let current = 0;
    // setState вызывается только внутри rAF-колбэков (вне тела эффекта)
    const step = () => {
      if (cancelled) return;
      current = Math.min(fullText.length, current + 14);
      setShown(current);
      if (current < fullText.length) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      cancelled = true;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [fullText]);

  if (!fullText) return "";
  return fullText.slice(0, shown);
}

export function HoroscopeSection() {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [focus, setFocus] = useState<(typeof FOCUS_OPTIONS)[number]["key"]>("love");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HoroscopeResponse | null>(null);
  // Верхняя граница даты рождения — только на клиенте (без расхождения гидратации, по НСК)
  const [maxBirth, setMaxBirth] = useState("");

  const animated = useTypewriter(result?.text ?? null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  // Верхняя граница даты рождения — только на клиенте (без расхождения гидратации, по НСК)
  useEffect(() => {
    const shifted = new Date(Date.now() + 7 * 60 * 60_000); // UTC+7
    setMaxBirth(shifted.toISOString().slice(0, 10));
  }, []);

  // После ответа — плавный скролл к карточке результата
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [result]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!birthDate || isLoading) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/horoscope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || null,
          birthDate,
          birthTime: birthTime || null,
          focus,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as Partial<HoroscopeResponse> & {
        error?: string;
      };
      if (!res.ok || !data.text || !data.sunSign || !data.moon) {
        throw new Error(data.error || "Не удалось составить прогноз");
      }
      setResult(data as HoroscopeResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Что-то пошло не так. Попробуйте ещё раз.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section id="horoscope" className="relative py-24 sm:py-32 bg-mystic-deep">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[420px] bg-glow-gold rounded-full opacity-10 blur-3xl" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6">
        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12 sm:mb-16"
        >
          <p className="lux-eyebrow lux-eyebrow-lines">Персональный прогноз</p>
          <h2 className="font-[family-name:var(--font-cormorant)] text-3xl sm:text-4xl md:text-5xl font-medium text-gold-foil text-balance mt-5 mb-6">
            Персональный прогноз
          </h2>
          <div className="lux-divider max-w-[280px] sm:max-w-xs mx-auto" aria-hidden="true">
            <span />
          </div>
          <p className="text-mystic-text-dim text-base max-w-xl mx-auto leading-relaxed mt-6">
            Укажите дату рождения — я соединю вашу натальную природу с астрономией
            сегодняшней Луны и составлю короткий личный прогноз.
          </p>
        </motion.div>

        {/* Форма */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <Card className="lux-card rounded-2xl">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="horoscope-name" className="text-mystic-text">
                      Имя <span className="text-mystic-text-dim/60">(необязательно)</span>
                    </Label>
                    <Input
                      id="horoscope-name"
                      placeholder="Как вас зовут?"
                      maxLength={40}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="lux-input rounded-lg h-11 px-4 text-mystic-text"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="horoscope-date" className="text-mystic-text">
                      Дата рождения
                    </Label>
                    <Input
                      id="horoscope-date"
                      type="date"
                      required
                      min="1900-01-01"
                      max={maxBirth}
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="lux-input rounded-lg h-11 px-4 text-mystic-text [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="horoscope-time" className="text-mystic-text">
                    Время рождения <span className="text-mystic-text-dim/60">(если знаете)</span>
                  </Label>
                  <Input
                    id="horoscope-time"
                    type="time"
                    value={birthTime}
                    onChange={(e) => setBirthTime(e.target.value)}
                    className="lux-input rounded-lg h-11 px-4 text-mystic-text [color-scheme:dark] sm:max-w-48"
                  />
                </div>

                {/* Фокус */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-mystic-text" id="horoscope-focus-label">
                    О чём спросить звёзды?
                  </span>
                  <div
                    role="radiogroup"
                    aria-labelledby="horoscope-focus-label"
                    className="flex flex-wrap gap-2"
                  >
                    {FOCUS_OPTIONS.map((option) => {
                      const active = focus === option.key;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setFocus(option.key)}
                          className={`inline-flex min-h-11 items-center justify-center rounded-full border bg-transparent px-5 text-sm transition-colors ${
                            active
                              ? "border-mystic-gold/55 bg-mystic-gold/10 text-mystic-gold"
                              : "border-mystic-gold/15 text-mystic-text-dim hover:border-mystic-gold/40 hover:text-mystic-text"
                          }`}
                        >
                          {option.emoji} {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !birthDate}
                  className="mt-1 lux-btn-gold rounded-full px-8 text-[12px] uppercase tracking-[0.16em] font-semibold h-11"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Читаю знаки…
                    </span>
                  ) : (
                    <span>Составить прогноз</span>
                  )}
                </Button>

                {error && (
                  <p role="alert" className="text-sm text-red-300">
                    {error}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Результат */}
        <AnimatePresence>
          {result && (
            <motion.div
              ref={resultRef}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="mt-8"
              aria-live="polite"
            >
              <Card className="lux-card lux-corners rounded-2xl">
                {/* Шапка с чипами */}
                <div className="flex flex-wrap items-center gap-2 rounded-t-2xl border-b border-mystic-gold/10 bg-mystic-gold/[0.04] px-6 py-4">
                  <span className="rounded-full border border-mystic-gold/20 bg-transparent px-3 py-1 text-xs font-medium text-mystic-gold">
                    Солнце {signPrep(result.sunSign.name)} {result.sunSign.symbol}
                  </span>
                  <span className="rounded-full border border-mystic-gold/15 bg-transparent px-3 py-1 text-xs text-mystic-text-dim">
                    <Moon className="mr-1 inline h-3 w-3 text-mystic-gold/70" aria-hidden="true" />
                    {result.moon.phaseName}, {Math.round(result.moon.illumination * 100)}% ·{" "}
                    {result.moon.lunarDay}-й лунный день
                  </span>
                  <span className="rounded-full border border-mystic-gold/15 bg-transparent px-3 py-1 text-xs text-mystic-text-dim">
                    Луна {signPrep(result.moon.zodiacName)} {result.moon.zodiacSymbol}
                  </span>
                </div>

                <CardContent className="p-6 sm:p-8">
                  <div aria-label="Текст персонального прогноза">
                    <Markdown source={animated} />
                    {animated.length < result.text.length && (
                      <span
                        className="ml-0.5 inline-block h-4 w-2 animate-pulse rounded-sm bg-mystic-gold align-middle"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <p className="mt-6 border-t border-mystic-gold/10 pt-4 text-xs text-mystic-text-dim/70">
                    Прогноз носит развлекательный характер и не заменяет консультацию.
                    Хотите глубже —{" "}
                    <a
                      href="#booking"
                      className="text-mystic-gold underline decoration-mystic-gold/30 underline-offset-2 transition-colors hover:decoration-mystic-gold/70"
                    >
                      запишитесь на полный разбор
                    </a>
                    .
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
