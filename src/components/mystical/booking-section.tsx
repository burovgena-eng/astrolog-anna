"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  MessageSquare,
  Send,
  Sparkles,
  Star,
  User,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  formatSlotRu,
  monthLabel,
  nskMonthKey,
  prevMonthKey,
  nextMonthKey,
  SCHEDULE_LABEL,
  TZ_LABEL,
  WEEKDAYS_SHORT,
} from "@/lib/schedule";
import { TARIFFS, tariffByName, type Tariff } from "@/lib/services";

type SlotInfo = { time: string; available: boolean };
type MonthData = { today: string; maxDate: string; days: Record<string, SlotInfo[]> };

const TARIFF_ICONS: Record<Tariff["icon"], typeof Zap> = {
  zap: Zap,
  star: Star,
  crown: Crown,
};

const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));

/** Геометрия месяца для сетки: сдвиг первой клетки и число дней. */
function monthGrid(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const lead = (first.getUTCDay() + 6) % 7; // неделя с понедельника
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { lead, daysInMonth };
}

export function BookingSection() {
  const [service, setService] = useState<string>("Полная консультация");
  const [monthKey, setMonthKey] = useState<string | null>(null);
  const [monthData, setMonthData] = useState<MonthData | null>(null);
  const [monthLoading, setMonthLoading] = useState(false);
  const [monthError, setMonthError] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [flexible, setFlexible] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<{ datetime: string; service: string } | null>(null);

  // Месяц инициализируем только на клиенте — без расхождения гидратации
  useEffect(() => {
    setMonthKey(nskMonthKey());
  }, []);

  // Выбор тарифа из секции услуг: кнопка «Записаться» на карточке
  useEffect(() => {
    const onSelect = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === "string" && tariffByName(detail)) setService(detail);
    };
    window.addEventListener("anna:select-tariff", onSelect);
    return () => window.removeEventListener("anna:select-tariff", onSelect);
  }, []);

  const loadMonth = useCallback(async (mk: string) => {
    setMonthLoading(true);
    setMonthError(false);
    try {
      const res = await fetch(`/api/slots?month=${mk}`);
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      setMonthData({ today: json.today, maxDate: json.maxDate, days: json.days });
    } catch {
      setMonthError(true);
    } finally {
      setMonthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!monthKey) return;
    setSelectedDate(null);
    setSelectedTime(null);
    loadMonth(monthKey);
  }, [monthKey, loadMonth]);

  const dayInfo = (dateKey: string): SlotInfo[] | undefined => monthData?.days[dateKey];
  const hasFreeSlots = (info: SlotInfo[] | undefined) => !!info?.some((s) => s.available);

  const canPrev = !!monthKey && !!monthData && monthKey > monthData.today.slice(0, 7);
  const canNext = !!monthKey && !!monthData && monthKey < monthData.maxDate.slice(0, 7);

  const slotReady = !!selectedDate && !!selectedTime;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!monthKey) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          contact,
          service,
          slot: slotReady ? { date: selectedDate, time: selectedTime } : undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409) {
          toast.error("Это время уже занято", {
            description: "Кто-то успел раньше — выберите другой слот.",
          });
          setSelectedTime(null);
          if (monthKey) loadMonth(monthKey);
          return;
        }
        throw new Error(json?.error ?? "");
      }
      const datetimeText = slotReady
        ? formatSlotRu(selectedDate as string, selectedTime as string)
        : "дата на выбор Анны";
      setSuccess({ datetime: datetimeText, service });
      toast.success("Заявка отправлена!", {
        description: "Я подтвержу запись лично — напишу вам в ближайшее время.",
      });
      setName("");
      setContact("");
      if (monthKey) loadMonth(monthKey);
    } catch {
      toast.error("Не удалось отправить заявку", {
        description: "Попробуйте позже или напишите напрямую в Telegram.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function resetAll() {
    setSuccess(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setFlexible(false);
    if (monthKey) loadMonth(monthKey);
  }

  const grid = monthKey ? monthGrid(monthKey) : null;

  return (
    <section id="booking" className="relative py-24 sm:py-32 bg-mystic-deep scroll-mt-20">
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-glow-gold rounded-full opacity-15 blur-3xl" />

      <div className="relative z-10 max-w-xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7 }} className="text-center mb-12">
          <h2 className="font-[family-name:var(--font-cormorant)] text-3xl sm:text-4xl md:text-5xl font-bold text-gold-gradient mb-5">
            Запишитесь на консультацию
          </h2>
          <p className="text-mystic-text-dim text-base max-w-md mx-auto leading-relaxed">
            Выберите формат, день и время — заявка уйдёт мне напрямую, и я подтвержу запись. Все данные конфиденциальны.
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-mystic-gold/20 bg-mystic-surface/60 px-3 py-1 text-xs text-mystic-text-dim">
            <Clock className="h-3.5 w-3.5 text-mystic-gold/80" aria-hidden="true" />
            {SCHEDULE_LABEL} · окно 60 мин · {TZ_LABEL}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.7, delay: 0.2 }}>
          <Card className="glass-strong border-gold-shimmer lux-corners rounded-2xl">
            <CardContent className="p-6 sm:p-8">
              {success ? (
                <div className="flex flex-col items-center gap-4 py-6 text-center" role="status">
                  <CheckCircle2 className="h-14 w-14 text-mystic-gold" aria-hidden="true" />
                  <h3 className="font-[family-name:var(--font-cormorant)] text-2xl sm:text-3xl font-semibold text-mystic-text">
                    Заявка отправлена!
                  </h3>
                  <p className="text-mystic-text-dim max-w-sm leading-relaxed">
                    Формат: <span className="text-mystic-gold font-medium">{success.service}</span>
                    <br />
                    Вы записаны на <span className="text-mystic-gold font-medium">{success.datetime}</span>.
                    Я подтвержу запись лично — напишу вам в ближайшее время.
                  </p>
                  <Button
                    type="button"
                    onClick={resetAll}
                    variant="outline"
                    className="mt-2 border-mystic-gold/40 text-mystic-gold hover:bg-mystic-gold/10 hover:text-mystic-gold"
                  >
                    Записаться ещё раз
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  {/* Шаг 1 — тариф */}
                  <div className="flex flex-col gap-3" role="group" aria-label="Шаг 1 — выберите формат консультации">
                    <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.28em] text-mystic-gold/90">
                      <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                      Шаг 1 · формат
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="group" aria-label="Тарифы">
                      {TARIFFS.map((t) => {
                        const Icon = TARIFF_ICONS[t.icon];
                        const selected = service === t.name;
                        return (
                          <button
                            key={t.name}
                            type="button"
                            aria-pressed={selected}
                            aria-label={`Выбрать формат: ${t.name}, ${t.price}, ${t.duration}`}
                            onClick={() => setService(t.name)}
                            className={`flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition-all duration-300 ${
                              selected
                                ? "border-mystic-gold/60 bg-gradient-to-b from-mystic-gold/12 to-mystic-gold/5 shadow-[inset_0_1px_0_rgba(241,235,225,0.08),0_0_28px_-6px_rgba(201,168,76,0.4)]"
                                : "border-mystic-gold/12 bg-mystic-surface/60 hover:border-mystic-gold/40 hover:bg-mystic-gold/5"
                            }`}
                          >
                            <span className="flex items-center gap-1.5 text-sm font-medium text-mystic-text">
                              <Icon className={`h-4 w-4 shrink-0 ${selected ? "text-mystic-gold" : "text-mystic-gold/70"}`} strokeWidth={1.5} aria-hidden="true" />
                              {t.name}
                            </span>
                            <span className="lux-numeral text-lg text-gold-foil">
                              {t.price}
                            </span>
                            <span className="text-[11px] text-mystic-text-dim/80">{t.duration}</span>
                          </button>
                        );
                      })}
                    </div>

                    {service === "Годовая стратегия" && (
                      <p className="rounded-lg border border-mystic-gold/20 bg-mystic-gold/5 px-3 py-2 text-xs leading-relaxed text-mystic-text-dim">
                        Первую сессию выберите в календаре ниже — расписание остальных трёх согласуем лично.
                      </p>
                    )}
                  </div>

                  {/* Шаг 2 — календарь */}
                  <div className="flex flex-col gap-3" role="group" aria-label="Шаг 2 — выберите день">
                    <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.28em] text-mystic-gold/90">
                      <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                      Шаг 2 · день
                    </p>

                    <div className="rounded-xl border border-mystic-gold/12 bg-mystic-surface/60 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => monthKey && canPrev && setMonthKey(prevMonthKey(monthKey))}
                          disabled={!canPrev}
                          aria-label="Предыдущий месяц"
                          className="rounded-lg p-2 text-mystic-text-dim transition-colors hover:bg-mystic-gold/10 hover:text-mystic-gold disabled:cursor-not-allowed disabled:opacity-25"
                        >
                          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <p className="font-[family-name:var(--font-cormorant)] text-lg font-semibold text-mystic-text" aria-live="polite">
                          {monthKey ? monthLabel(monthKey) : "…"}
                        </p>
                        <button
                          type="button"
                          onClick={() => monthKey && canNext && setMonthKey(nextMonthKey(monthKey))}
                          disabled={!canNext}
                          aria-label="Следующий месяц"
                          className="rounded-lg p-2 text-mystic-text-dim transition-colors hover:bg-mystic-gold/10 hover:text-mystic-gold disabled:cursor-not-allowed disabled:opacity-25"
                        >
                          <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center" role="presentation">
                        {WEEKDAYS_SHORT.map((wd, i) => (
                          <span
                            key={wd}
                            className={`pb-1 text-[11px] font-medium uppercase tracking-wider ${i === 6 ? "text-mystic-text-dim/40" : "text-mystic-text-dim/70"}`}
                          >
                            {wd}
                          </span>
                        ))}

                        {monthLoading || !grid
                          ? Array.from({ length: 35 }).map((_, i) => (
                              <span key={`sk-${i}`} className="h-9 animate-pulse rounded-lg bg-mystic-surface/80" aria-hidden="true" />
                            ))
                          : (
                              <>
                                {Array.from({ length: grid.lead }).map((_, i) => (
                                  <span key={`lead-${i}`} aria-hidden="true" />
                                ))}
                                {Array.from({ length: grid.daysInMonth }).map((_, i) => {
                                  const dateKey = `${monthKey}-${pad2(i + 1)}`;
                                  const info = dayInfo(dateKey);
                                  const enabled = hasFreeSlots(info);
                                  const selected = selectedDate === dateKey;
                                  return (
                                    <button
                                      key={dateKey}
                                      type="button"
                                      disabled={!enabled}
                                      aria-label={`Выбрать ${dateKey}${enabled ? ", есть свободные окна" : ", мест нет"}`}
                                      aria-pressed={selected}
                                      onClick={() => {
                                        setSelectedDate(dateKey);
                                        setSelectedTime(null);
                                        setFlexible(false);
                                      }}
                                      className={`relative h-9 rounded-lg text-sm transition-colors sm:h-10 ${
                                        selected
                                          ? "bg-gold-gradient font-semibold text-mystic-deep"
                                          : enabled
                                            ? "text-mystic-text hover:border hover:border-mystic-gold/40 hover:bg-mystic-gold/10"
                                            : "cursor-not-allowed text-mystic-text-dim/30"
                                      }`}
                                    >
                                      {i + 1}
                                      {enabled && !selected && (
                                        <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-mystic-gold/70" aria-hidden="true" />
                                      )}
                                    </button>
                                  );
                                })}
                              </>
                            )}
                      </div>

                      {monthError && (
                        <div className="mt-3 flex flex-col items-center gap-2 text-center">
                          <p className="text-sm text-mystic-text-dim">Не удалось загрузить расписание.</p>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => monthKey && loadMonth(monthKey)}
                            className="h-8 border-mystic-gold/40 px-4 text-xs text-mystic-gold hover:bg-mystic-gold/10 hover:text-mystic-gold"
                          >
                            Попробовать снова
                          </Button>
                        </div>
                      )}

                      <p className="mt-3 text-center text-[11px] leading-relaxed text-mystic-text-dim/60">
                        Точка под числом — есть свободные окна. Воскресенье — выходной.
                      </p>
                    </div>
                  </div>

                  {/* Шаг 3 — время */}
                  <div className="flex flex-col gap-3" role="group" aria-label="Шаг 3 — выберите время">
                    <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.28em] text-mystic-gold/90">
                      <Clock className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                      Шаг 3 · время
                    </p>

                    {selectedDate && dayInfo(selectedDate) ? (
                      <div className="flex flex-wrap gap-2" role="group" aria-label="Свободное время">
                        {dayInfo(selectedDate)!.map((s) => {
                          const selected = selectedTime === s.time;
                          return (
                            <button
                              key={s.time}
                              type="button"
                              disabled={!s.available}
                              aria-pressed={selected}
                              aria-label={s.available ? `Выбрать ${s.time}` : `${s.time} — занято`}
                              onClick={() => {
                                setSelectedTime(s.time);
                                setFlexible(false);
                              }}
                              className={`min-w-[64px] rounded-full border px-4 py-2 text-sm transition-all duration-300 ${
                                selected
                                  ? "lux-btn-gold border-transparent font-semibold"
                                  : s.available
                                    ? "border-mystic-gold/30 text-mystic-gold hover:border-mystic-gold/60 hover:bg-mystic-gold/10"
                                    : "cursor-not-allowed border-transparent bg-mystic-surface/60 text-mystic-text-dim/40 line-through"
                              }`}
                            >
                              {s.time}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="rounded-lg border border-mystic-gold/10 bg-mystic-surface/40 px-4 py-3 text-sm text-mystic-text-dim/70">
                        {monthLoading ? "Загружаю расписание…" : "Сначала выберите день в календаре — здесь появятся свободные окна."}
                      </p>
                    )}

                    {!slotReady && (
                      <button
                        type="button"
                        onClick={() => {
                          setFlexible(true);
                          setSelectedDate(null);
                          setSelectedTime(null);
                        }}
                        className={`self-start text-xs underline decoration-dotted underline-offset-4 transition-colors ${
                          flexible ? "text-mystic-gold" : "text-mystic-text-dim/70 hover:text-mystic-gold"
                        }`}
                        aria-pressed={flexible}
                      >
                        {flexible ? "✓ Дата на выбор Анны" : "Не нашёл удобное время — пусть дата будет на выбор Анны"}
                      </button>
                    )}
                    <p className="text-[11px] text-mystic-text-dim/60">Время — новосибирское ({TZ_LABEL}).</p>
                  </div>

                  {/* Шаг 4 — контакты */}
                  <div className="flex flex-col gap-4" role="group" aria-label="Шаг 4 — ваши данные">
                    <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.28em] text-mystic-gold/90">
                      <User className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                      Шаг 4 · ваши данные
                    </p>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="booking-name" className="text-mystic-text">
                        <User className="inline w-4 h-4 mr-1.5 -mt-0.5" />
                        Имя
                      </Label>
                      <Input
                        id="booking-name"
                        placeholder="Ваше имя"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="lux-input h-11 rounded-lg text-mystic-text"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="booking-contact" className="text-mystic-text">
                        <MessageSquare className="inline w-4 h-4 mr-1.5 -mt-0.5" />
                        Telegram или телефон
                      </Label>
                      <Input
                        id="booking-contact"
                        placeholder="@username или номер телефона"
                        required
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        className="lux-input h-11 rounded-lg text-mystic-text"
                      />
                    </div>
                  </div>

                  {/* Сводка перед отправкой */}
                  <p className="text-center text-xs leading-relaxed text-mystic-text-dim/80" aria-live="polite">
                    {service}
                    {slotReady
                      ? ` · ${formatSlotRu(selectedDate as string, selectedTime as string)}`
                      : flexible
                        ? " · дата на выбор Анны"
                        : " · время пока не выбрано"}
                  </p>

                  <Button
                    type="submit"
                    disabled={isLoading || !name.trim() || !contact.trim() || (!slotReady && !flexible)}
                    className="lux-btn-gold mt-2 h-12 rounded-full text-[13px] uppercase tracking-[0.16em] font-semibold disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-mystic-deep/30 border-t-mystic-deep" />
                        Отправка…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Отправить заявку
                      </span>
                    )}
                  </Button>

                  <p className="text-mystic-text-dim/70 text-xs text-center">
                    Нажимая кнопку, вы соглашаетесь с <a href="/oferta" className="underline hover:text-mystic-gold transition-colors">публичной офертой</a>.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
