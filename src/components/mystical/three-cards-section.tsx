'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Gem, MoonStar, RefreshCw, Star } from 'lucide-react';
import { getRandomCardShuffle, type TarotCard } from '@/lib/tarot-data';
import { Button } from '@/components/ui/button';

const FAN_SIZE = 7;
const SLOT_LABELS = ['Прошлое', 'Настоящее', 'Будущее'];
const HINTS = [
  'Сосредоточьтесь на вопросе и выберите первую карту — она расскажет о прошлом',
  'Теперь выберите карту настоящего',
  'И последнюю — карту будущего',
];

/** Draw `count` DIFFERENT random cards from the deck (rejection sampling). */
function drawDistinctCards(count: number): TarotCard[] {
  const picked: TarotCard[] = [];
  let guard = 0;
  while (picked.length < count && guard < 500) {
    const card = getRandomCardShuffle();
    if (!picked.some((c) => c.name === card.name)) picked.push(card);
    guard += 1;
  }
  return picked;
}

/** Scalable mystical card back (same aesthetics as the card-of-day back). */
function MysticCardBack({ label }: { label?: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-mystic-surface via-mystic-deep to-mystic-surface-light" />
      <div
        className="absolute inset-0 opacity-25"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, transparent 20%, rgba(201,168,76,0.18) 21%, transparent 22%), ' +
            'radial-gradient(circle at 50% 50%, transparent 34%, rgba(201,168,76,0.12) 35%, transparent 36%), ' +
            'radial-gradient(circle at 50% 50%, transparent 48%, rgba(201,168,76,0.1) 49%, transparent 50%), ' +
            'radial-gradient(circle at 50% 50%, transparent 62%, rgba(201,168,76,0.07) 63%, transparent 64%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(30deg, rgba(201,168,76,0.06) 12%, transparent 12.5%, transparent 87%, rgba(201,168,76,0.06) 87.5%), ' +
            'linear-gradient(150deg, rgba(201,168,76,0.06) 12%, transparent 12.5%, transparent 87%, rgba(201,168,76,0.06) 87.5%), ' +
            'linear-gradient(270deg, rgba(201,168,76,0.06) 12%, transparent 12.5%, transparent 87%, rgba(201,168,76,0.06) 87.5%), ' +
            'linear-gradient(90deg, rgba(111,94,143,0.07) 12%, transparent 12.5%, transparent 87%, rgba(111,94,143,0.07) 87.5%)',
          backgroundSize: '80px 140px',
        }}
      />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 sm:gap-2.5">
        <div
          className="rounded-full border-2 border-mystic-gold/30"
          style={{
            width: '64%',
            aspectRatio: '2 / 1',
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(201,168,76,0.22) 0%, rgba(111,94,143,0.12) 50%, transparent 70%)',
          }}
        />
        <div
          className="h-px"
          style={{
            width: '86%',
            background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.4), transparent)',
          }}
        />
        <MoonStar className="w-6 h-6 sm:w-9 sm:h-9 text-mystic-gold/60" strokeWidth={1.5} />
        {label && (
          <p className="text-mystic-gold/50 uppercase tracking-widest text-[9px] sm:text-[11px] font-light">
            {label}
          </p>
        )}
      </div>
      <svg className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 w-4 h-4 sm:w-6 sm:h-6 text-mystic-gold/25" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 20 Q2 2 20 2" /><path d="M8 20 Q8 8 20 8" />
      </svg>
      <svg className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 w-4 h-4 sm:w-6 sm:h-6 text-mystic-gold/25 rotate-90" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 20 Q2 2 20 2" /><path d="M8 20 Q8 8 20 8" />
      </svg>
      <svg className="absolute bottom-1.5 left-1.5 sm:bottom-2.5 sm:left-2.5 w-4 h-4 sm:w-6 sm:h-6 text-mystic-gold/25 -rotate-90" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 20 Q2 2 20 2" /><path d="M8 20 Q8 8 20 8" />
      </svg>
      <svg className="absolute bottom-1.5 right-1.5 sm:bottom-2.5 sm:right-2.5 w-4 h-4 sm:w-6 sm:h-6 text-mystic-gold/25 rotate-180" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 20 Q2 2 20 2" /><path d="M8 20 Q8 8 20 8" />
      </svg>
      <div className="absolute inset-1.5 rounded-md sm:rounded-lg border border-mystic-gold/20" />
    </div>
  );
}

interface RevealColumnProps {
  card: TarotCard;
  index: number;
  isFlipped: boolean;
}

function RevealColumn({ card, index, isFlipped }: RevealColumnProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="perspective-1000 w-full max-w-[260px]">
        <div
          className="relative w-full h-[360px] sm:h-[400px]"
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Card back (face-down) */}
          <div className="absolute inset-0 backface-hidden rounded-xl overflow-hidden">
            <MysticCardBack label="Открываю…" />
          </div>

          {/* Card front (face-up) */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl border-gold-shimmer overflow-hidden">
            <div
              className="h-full flex flex-col items-center p-4 sm:p-5 text-center"
              style={{
                background:
                  'linear-gradient(180deg, #17141d 0%, #100e14 55%, #0b0a0e 100%)',
              }}
            >
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border border-mystic-gold/40 bg-glow-gold mb-3 shrink-0">
                <img
                  src={card.image}
                  alt={card.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-[family-name:var(--font-cormorant)] text-xl sm:text-2xl font-medium text-gold-foil leading-tight">
                {card.name}
              </h3>
              <div className="w-14 h-px bg-gradient-to-r from-transparent via-mystic-gold/50 to-transparent my-3 shrink-0" />
              <p className="text-mystic-text-dim text-xs sm:text-sm leading-relaxed">
                {card.meaning}
              </p>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-[11px] uppercase tracking-[0.26em] text-mystic-gold/70">
        {SLOT_LABELS[index]}
      </p>
    </div>
  );
}

export function ThreeCardsSection() {
  // Deal the fan immediately (client and server) — the initial markup of seven
  // face-down cards is identical, so there is no hydration mismatch.
  const [fan, setFan] = useState<TarotCard[]>(() => drawDistinctCards(FAN_SIZE));
  const [picked, setPicked] = useState<number[]>([]);
  const [stage, setStage] = useState<'choosing' | 'reveal'>('choosing');
  const [flippedCount, setFlippedCount] = useState(0);
  const [summaryReady, setSummaryReady] = useState(false);
  const timersRef = useRef<number[]>([]);

  // Clear pending timers on unmount.
  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  const addTimer = (fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  };

  const pickCard = (index: number) => {
    if (stage !== 'choosing' || picked.includes(index) || picked.length >= 3) return;
    const next = [...picked, index];
    setPicked(next);
    if (next.length === 3) {
      // Swap fan → reveal, then flip the three cards with a 400ms stagger.
      addTimer(() => setStage('reveal'), 350);
      [0, 1, 2].forEach((i) => addTimer(() => setFlippedCount(i + 1), 1300 + i * 400));
      addTimer(() => setSummaryReady(true), 3100);
    }
  };

  const resetReading = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    setFan(drawDistinctCards(FAN_SIZE));
    setPicked([]);
    setFlippedCount(0);
    setSummaryReady(false);
    setStage('choosing');
  };

  const scrollToBooking = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.querySelector('#booking')?.scrollIntoView({ behavior: 'smooth' });
  };

  const chosen = picked.map((i) => fan[i]);
  const summary = chosen.length === 3 ? chosen[2] : null;

  return (
    <section
      id="three-cards"
      className="relative py-24 sm:py-32 overflow-hidden"
      aria-label="Гадание онлайн — три карты"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-mystic-purple/5 blur-[120px] rounded-full" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <p className="lux-eyebrow lux-eyebrow-lines">Гадание</p>
          <h2 className="font-[family-name:var(--font-cormorant)] text-3xl sm:text-4xl md:text-5xl font-medium text-gold-foil text-balance mt-5 mb-6">
            Гадание онлайн
          </h2>
          <div className="lux-divider max-w-[280px] sm:max-w-xs mx-auto" aria-hidden="true">
            <span />
          </div>
          <p className="text-mystic-text-dim text-base sm:text-lg max-w-xl mx-auto mt-6">
            Задайте вопрос — и выберите три карты: прошлое, настоящее и будущее
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
            {stage === 'choosing' ? (
              /* ===== STEP 1: slots + fan of face-down cards ===== */
              <motion.div
                key="choosing"
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.4 }}
                className="w-full"
              >
                {/* Labeled slots */}
                <div className="grid grid-cols-3 gap-2 sm:gap-5 max-w-xl mx-auto mb-10 sm:mb-12">
                  {SLOT_LABELS.map((label, i) => {
                    const filled = picked.length > i;
                    return (
                      <div
                        key={label}
                        className={`flex flex-col items-center gap-2 sm:gap-3 rounded-xl border border-dashed p-2 sm:p-3 transition-colors duration-300 ${
                          filled
                            ? 'border-mystic-gold/55 bg-mystic-gold/5'
                            : 'border-mystic-gold/20'
                        }`}
                      >
                        <div className="relative w-12 h-[72px] sm:w-14 sm:h-[84px]">
                          {filled ? (
                            <motion.div
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                              className="absolute inset-0 rounded-md overflow-hidden"
                            >
                              <MysticCardBack />
                            </motion.div>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Star className="w-4 h-4 text-mystic-gold/30" />
                            </div>
                          )}
                        </div>
                        <span
                          className={`text-[9px] sm:text-xs uppercase tracking-widest transition-colors duration-300 ${
                            filled ? 'text-mystic-gold' : 'text-mystic-gold/50'
                          }`}
                        >
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Fan of 7 face-down cards */}
                <div
                  className="flex justify-center items-end pt-6"
                  role="group"
                  aria-label="Семь карт рубашки вверх — выберите три"
                >
                  {fan.map((card, i) => {
                    const isChosen = picked.includes(i);
                    return (
                      <motion.div
                        key={`${card.name}-${i}`}
                        initial={{ opacity: 0, y: 24, rotate: (i - 3) * 2.5 }}
                        animate={{ opacity: 1, y: Math.abs(i - 3) * 5, rotate: (i - 3) * 2.5 }}
                        exit={{ opacity: 0, y: 16, scale: 0.85, rotate: (i - 3) * 2.5 }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                        className={`relative ${i > 0 ? '-ml-5 sm:ml-0' : ''}`}
                        style={{ zIndex: isChosen ? 20 : i }}
                      >
                        <button
                          type="button"
                          onClick={() => pickCard(i)}
                          disabled={isChosen}
                          aria-label={
                            isChosen
                              ? `Карта ${i + 1} выбрана — позиция «${SLOT_LABELS[picked.indexOf(i)]}»`
                              : `Выбрать карту ${i + 1} из семи`
                          }
                          className={`relative block w-16 h-24 sm:w-20 sm:h-[120px] lg:w-24 lg:h-36 rounded-lg sm:rounded-xl overflow-hidden transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mystic-gold focus-visible:ring-offset-2 focus-visible:ring-offset-mystic-deep ${
                            isChosen
                              ? 'ring-2 ring-mystic-gold opacity-90 cursor-default'
                              : 'cursor-pointer hover:-translate-y-2 hover:shadow-[0_12px_32px_rgba(201,168,76,0.3)]'
                          }`}
                        >
                          <MysticCardBack />
                          {isChosen && (
                            <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-6 w-6 rounded-full bg-gold-gradient text-mystic-deep text-xs font-bold flex items-center justify-center shadow-lg z-10">
                              {picked.indexOf(i) + 1}
                            </span>
                          )}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Hint */}
                <div className="h-12 mt-8 flex items-center justify-center" aria-live="polite">
                  <p className="text-mystic-text-dim/70 text-sm tracking-wide text-center px-4">
                    {HINTS[Math.min(picked.length, HINTS.length - 1)]}
                  </p>
                </div>
              </motion.div>
            ) : (
              /* ===== STEP 2: three cards flip one by one ===== */
              <motion.div
                key="reveal"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6 max-w-4xl mx-auto">
                  {chosen.map((card, i) => (
                    <RevealColumn
                      key={card.name}
                      card={card}
                      index={i}
                      isFlipped={flippedCount > i}
                    />
                  ))}
                </div>

                {/* Status line while flipping */}
                <div className="h-10 mt-8 flex items-center justify-center" aria-live="polite">
                  {flippedCount < 3 ? (
                    <p className="text-mystic-gold/50 text-sm tracking-wide">
                      Карты открывают вашу историю…
                    </p>
                  ) : null}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        {/* ===== STEP 3: interpretation ===== */}
        <AnimatePresence>
          {summaryReady && summary && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto mt-4 sm:mt-6"
            >
              <div className="glass-strong lux-corners rounded-xl p-6 sm:p-8 text-center relative">
                <div className="absolute -inset-px rounded-xl bg-glow-gold blur-2xl opacity-[0.08] pointer-events-none" />
                <div className="relative z-10">
                  <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-mystic-gold/25">
                    <Gem className="h-5 w-5 text-mystic-gold" strokeWidth={1.5} />
                  </div>
                  <p className="text-mystic-text text-base sm:text-lg leading-relaxed">
                    Ваш путь: из прошлого —{' '}
                    <span className="text-mystic-gold">«{chosen[0].name}»</span>, через
                    настоящее —{' '}
                    <span className="text-mystic-gold">«{chosen[1].name}»</span>, к
                    будущему —{' '}
                    <span className="text-mystic-gold">«{chosen[2].name}»</span>.
                  </p>
                  <div className="mx-auto w-16 h-px bg-gradient-to-r from-transparent via-mystic-gold/50 to-transparent my-5" />
                  <p className="text-mystic-text-dim text-sm sm:text-base mb-2">
                    Главный совет расклада:
                  </p>
                  <p className="text-mystic-gold-light italic text-sm sm:text-base leading-relaxed">
                    «{summary.advice}»
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 mt-8">
                    <Button
                      onClick={resetReading}
                      className="lux-btn-gold rounded-full px-8 h-11 text-[12px] uppercase tracking-[0.16em] font-semibold"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" strokeWidth={1.5} />
                      Задать новый вопрос
                    </Button>
                    <a
                      href="#booking"
                      onClick={scrollToBooking}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-mystic-gold/25 bg-transparent px-6 py-2 text-[13px] text-mystic-gold/90 transition-colors hover:border-mystic-gold/50 hover:bg-mystic-gold/5 hover:text-mystic-gold-light"
                    >
                      Хотите глубже? Запишитесь на консультацию →
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
