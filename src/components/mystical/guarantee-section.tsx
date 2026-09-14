'use client';

import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

function scrollTo(href: string) {
  const el = document.querySelector(href);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

export function GuaranteeSection() {
  return (
    <section id="guarantee" className="py-24 sm:py-32 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-mystic-gold blur-3xl rounded-full opacity-[0.06]" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Люкс-шапка секции: надзаголовок с линиями + серифная фольга + орнаментальный разделитель */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-center mb-16 sm:mb-20"
        >
          <p className="lux-eyebrow lux-eyebrow-lines">Гарантия</p>
          <h2 className="font-[family-name:var(--font-cormorant)] text-4xl sm:text-5xl font-medium text-gold-foil text-balance mt-5 mb-6">
            Моя гарантия
          </h2>
          <div className="lux-divider max-w-[280px] sm:max-w-xs mx-auto" aria-hidden="true">
            <span />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
          className="max-w-3xl mx-auto"
        >
          <div className="lux-corners glass-strong rounded-2xl p-8 sm:p-12 relative">
            {/* Hover glow */}
            <div className="absolute -inset-px rounded-2xl bg-glow-gold blur-2xl opacity-[0.08] pointer-events-none" />

            <div className="relative z-10">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-mystic-gold/25 bg-mystic-deep/60 mx-auto mb-6">
                <ShieldCheck className="w-7 h-7 text-mystic-gold" strokeWidth={1.5} />
              </span>

              <p className="text-mystic-text text-lg sm:text-xl leading-relaxed text-center">
                Если после консультации вы почувствуете, что не получили ответы на свои вопросы — я верну деньги. Без условий и долгих обсуждений.
              </p>

              <div className="lux-divider max-w-[160px] mx-auto my-7" aria-hidden="true">
                <span />
              </div>

              <p className="text-mystic-text-dim text-base leading-relaxed text-center">
                Я уверена в своём качестве. И хочу, чтобы вы тоже были уверены — рисковать не придётся.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
