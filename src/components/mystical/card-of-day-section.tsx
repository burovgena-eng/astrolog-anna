'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye } from 'lucide-react';

interface CardOfDayData {
  name: string;
  meaning: string;
  advice: string;
  image: string;
}

type CardState = 'closed' | 'revealing' | 'revealed';

function MysticalPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-mystic-surface via-mystic-deep to-mystic-surface-light" />
      <div
        className="absolute inset-0 rounded-full opacity-20"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, transparent 20%, rgba(201,168,76,0.15) 21%, transparent 22%), ' +
            'radial-gradient(circle at 50% 50%, transparent 35%, rgba(201,168,76,0.1) 36%, transparent 37%), ' +
            'radial-gradient(circle at 50% 50%, transparent 50%, rgba(201,168,76,0.08) 51%, transparent 52%), ' +
            'radial-gradient(circle at 50% 50%, transparent 65%, rgba(201,168,76,0.05) 66%, transparent 67%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(30deg, rgba(201,168,76,0.06) 12%, transparent 12.5%, transparent 87%, rgba(201,168,76,0.06) 87.5%),
            linear-gradient(150deg, rgba(201,168,76,0.06) 12%, transparent 12.5%, transparent 87%, rgba(201,168,76,0.06) 87.5%),
            linear-gradient(270deg, rgba(201,168,76,0.06) 12%, transparent 12.5%, transparent 87%, rgba(201,168,76,0.06) 87.5%),
            linear-gradient(90deg, rgba(111,94,143,0.07) 12%, transparent 12.5%, transparent 87%, rgba(111,94,143,0.07) 87.5%)
          `,
          backgroundSize: '80px 140px',
        }}
      />
      {/* Орнаментальный овал — строго по центру карты: глаз (тоже по центру карты)
          всегда сидит ровно в середине ореола (Task 30) */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-24 rounded-full border-2 border-mystic-gold/30"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(201,168,76,0.22) 0%, rgba(111,94,143,0.12) 50%, transparent 70%)',
        }}
      />
      <div className="absolute top-[calc(50%+37.5px)] left-1/2 -translate-x-1/2 h-px w-32 bg-gradient-to-r from-transparent via-mystic-gold/40 to-transparent" />
      <svg className="absolute top-4 left-4 w-10 h-10 text-mystic-gold/25" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 20 Q2 2 20 2" /><path d="M8 20 Q8 8 20 8" />
      </svg>
      <svg className="absolute top-4 right-4 w-10 h-10 text-mystic-gold/25 rotate-90" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 20 Q2 2 20 2" /><path d="M8 20 Q8 8 20 8" />
      </svg>
      <svg className="absolute bottom-4 left-4 w-10 h-10 text-mystic-gold/25 -rotate-90" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 20 Q2 2 20 2" /><path d="M8 20 Q8 8 20 8" />
      </svg>
      <svg className="absolute bottom-4 right-4 w-10 h-10 text-mystic-gold/25 rotate-180" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 20 Q2 2 20 2" /><path d="M8 20 Q8 8 20 8" />
      </svg>
      <div className="absolute inset-0 rounded-xl border border-mystic-gold/20" />
    </div>
  );
}

export function CardOfDaySection() {
  const [card, setCard] = useState<CardOfDayData | null>(null);
  const [cardState, setCardState] = useState<CardState>('closed');
  const [isFlipped, setIsFlipped] = useState(false);

  const revealCard = useCallback(async () => {
    if (cardState !== 'closed') return;

    setCardState('revealing');

    try {
      const res = await fetch('/api/card-of-day');
      if (!res.ok) throw new Error('Failed to fetch card');
      const data: CardOfDayData = await res.json();
      setCard(data);

      setTimeout(() => {
        setIsFlipped(true);
        setCardState('revealed');
      }, 800);
    } catch (err) {
      console.error('Error fetching card:', err);
      setCardState('closed');
    }
  }, [cardState]);

  return (
    <section
      id="card-of-day"
      className="relative min-h-screen flex flex-col items-center justify-center py-24 px-4 overflow-hidden"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-mystic-purple/5 blur-[120px] pointer-events-none" />

      {/* Section heading — люкс-шапка: надзаголовок с линиями + серифная фольга + разделитель */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center mb-12 sm:mb-14"
      >
        <p className="lux-eyebrow lux-eyebrow-lines">Карта дня</p>
        <h2 className="font-[family-name:var(--font-cormorant)] text-4xl md:text-5xl font-medium text-gold-foil text-balance mt-5 mb-6">
          Карта дня
        </h2>
        <div className="lux-divider max-w-[280px] mx-auto" aria-hidden="true">
          <span />
        </div>
        <p className="text-mystic-text-dim text-lg max-w-md mx-auto mt-6">
          Откройте свою карту дня и получите мистическое напутствие от вселенной
        </p>
      </motion.div>

      {/* Card container */}
      <div className="flex flex-col items-center gap-8">
        {/* Outer: floating animation (framer-motion) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{
            opacity: 1,
            scale: 1,
            y:
              cardState === 'revealing'
                ? [0, -12, 0, -8, 0]
                : cardState === 'closed'
                  ? [0, -6, 0]
                  : 0,
            rotateZ:
              cardState === 'revealing'
                ? [0, -1, 1, -0.5, 0]
                : 0,
          }}
          transition={
            cardState === 'revealing'
              ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
              : cardState === 'closed'
                ? { y: { duration: 3, repeat: Infinity, ease: 'easeInOut' }, opacity: { duration: 0.6 }, scale: { duration: 0.6 } }
                : { duration: 0.6 }
          }
          className="perspective-1000 relative"
        >
          {/* Люкс-паспарту: статичное смещённое hairline-обрамление под картой */}
          <div
            aria-hidden="true"
            className="absolute inset-0 translate-x-3 translate-y-3 rounded-xl border border-mystic-gold/12 pointer-events-none"
          />

          {/* Inner: 3D flip (pure CSS) */}
          <div
            className="relative w-72 h-[480px] cursor-pointer select-none"
            role="button"
            tabIndex={0}
            aria-label={cardState === 'closed' ? 'Открыть карту дня' : card ? `Карта дня: ${card.name}` : 'Карта дня'}
            style={{
              transformStyle: 'preserve-3d',
              transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
            onClick={() => revealCard()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                revealCard();
              }
            }}
          >
            {/* Card Back */}
            <div className="absolute inset-0 backface-hidden rounded-xl overflow-hidden">
              <MysticalPattern />
              {/* Центральный символ — строго внутри орнаментального овала */}
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <motion.div
                  animate={{ scale: [1, 1.12, 1], opacity: [0.45, 0.85, 0.45] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Eye className="w-10 h-10 text-mystic-gold/60" strokeWidth={1.5} />
                </motion.div>
              </div>
              {/* Подпись — в нижней трети, чтобы не пересекаться с орнаментом */}
              <div className="absolute inset-x-0 bottom-8 z-10 flex flex-col items-center gap-2 pointer-events-none">
                <p className="text-mystic-gold/50 text-[11px] tracking-[0.22em] uppercase font-light">
                  Нажмите, чтобы открыть
                </p>
                {cardState === 'revealing' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-mystic-gold/60 animate-pulse" />
                    <span className="text-mystic-gold/40 text-xs">Вселенная говорит...</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-mystic-gold/60 animate-pulse" style={{ animationDelay: '0.5s' }} />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Card Front */}
            <div
              className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl overflow-hidden border-gold-shimmer"
              style={{
                background:
                  'linear-gradient(180deg, #17141d 0%, #100e14 55%, #0b0a0e 100%)',
              }}
            >
              {/* Внутреннее hairline-обрамление лица карты */}
              <div aria-hidden="true" className="absolute inset-2 rounded-lg border border-mystic-gold/15 pointer-events-none" />
              <AnimatePresence mode="wait">
                {card && (
                  <motion.div
                    key={card.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="relative h-full flex flex-col items-center p-6 pt-8 text-center pointer-events-none"
                  >
                    <div className="w-28 h-28 rounded-full overflow-hidden border border-mystic-gold/40 bg-glow-gold shrink-0">
                      <img
                        src={card.image}
                        alt={card.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = `
                            <div class="w-full h-full bg-gradient-to-br from-mystic-purple-dark to-mystic-deep flex items-center justify-center">
                              <svg class="w-10 h-10 text-mystic-gold/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                                <path d="M2 17l10 5 10-5"/>
                                <path d="M2 12l10 5 10-5"/>
                              </svg>
                            </div>`;
                        }}
                      />
                    </div>
                    <h3 className="font-[family-name:var(--font-cormorant)] text-2xl font-medium text-gold-foil mt-4">
                      {card.name}
                    </h3>
                    <div className="w-16 h-px bg-gradient-to-r from-transparent via-mystic-gold/50 to-transparent mt-3 mb-3" />
                    <p className="text-mystic-text/90 text-sm leading-relaxed">
                      {card.meaning}
                    </p>
                    {/* Гибкий отступ: прижимает «Совет дня» к низу без дыры в середине */}
                    <div className="flex-1 min-h-4" />
                    <div className="glass rounded-lg p-3 w-full">
                      <p className="text-mystic-gold-light/80 text-[11px] uppercase tracking-[0.18em] mb-1">
                        Совет дня
                      </p>
                      <p className="text-mystic-text-dim text-xs leading-relaxed">
                        {card.advice}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Subtle text below — always same height to avoid jumps */}
        <div className="h-12 flex items-center justify-center">
          {cardState === 'closed' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="text-mystic-text-dim/40 text-sm tracking-wide"
            >
              ✦ Космос хранит для вас послание ✦
            </motion.p>
          )}
          {cardState === 'revealed' && card && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-mystic-text-dim/40 text-sm tracking-wide"
            >
              Энергия дня: <span className="text-mystic-gold/60">{card.name}</span>
            </motion.p>
          )}
        </div>
      </div>
    </section>
  );
}
