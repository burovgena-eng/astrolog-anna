'use client';

import { motion, type Variants } from 'framer-motion';
import { Heart, TrendingUp, Eye } from 'lucide-react';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: 'easeOut' },
  },
};

const painPoints = [
  {
    icon: Heart,
    title: 'Отношения',
    quote: 'Я не понимаю, что происходит между нами',
    body: 'Вы чувствуете, что отношения зашли в тупик, но не можете решить — спасать или отпускать. Или долго не можете встретить своего человека и не понимаете, почему. Я помогу увидеть ситуацию объективно и услышать, чего вы на самом деле хотите.',
  },
  {
    icon: TrendingUp,
    title: 'Карьера и деньги',
    quote: 'Я стою на месте и не вижу пути вперёд',
    body: 'Кажется, что вы уперлись в стеклянный потолок. Работа не приносит радости, деньги не растут, а направление — непонятно. Я покажу ваши сильные стороны и подскажу, куда направить энергию, чтобы дела пошли.',
  },
  {
    icon: Eye,
    title: 'Самопознание',
    quote: 'Я хочу понять себя — по-настоящему',
    body: 'Вы ловите себя на том, что повторяете одни и те же сценарии. Снова и снова выбираете не то. Хотите наконец разобраться в себе, своих талантах и жизненных циклах — не через психологические тесты, а через глубокий астрологический и рунический разбор.',
  },
];

export function PainPointsSection() {
  return (
    <section id="pain-points" className="py-24 sm:py-32 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-1/4 -left-32 w-96 h-96 bg-mystic-purple blur-3xl rounded-full opacity-20" />
      <div className="pointer-events-none absolute bottom-1/4 -right-32 w-96 h-96 bg-mystic-gold blur-3xl rounded-full opacity-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Люкс-шапка секции: надзаголовок с линиями + серифная фольга + орнаментальный разделитель */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-center mb-16 sm:mb-20"
        >
          <p className="lux-eyebrow lux-eyebrow-lines">Знакомо?</p>
          <h2 className="font-[family-name:var(--font-cormorant)] text-4xl sm:text-5xl font-medium text-gold-foil text-balance mt-5 mb-6">
            Вы узнаёте себя?
          </h2>
          <div className="lux-divider max-w-[280px] sm:max-w-xs mx-auto" aria-hidden="true">
            <span />
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {painPoints.map((point) => {
            const Icon = point.icon;
            return (
              <motion.div key={point.title} variants={cardVariants} className="h-full">
                <div className="lux-card rounded-xl h-full">
                  <div className="p-6 sm:p-8 flex flex-col gap-6 h-full">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-mystic-gold/25 bg-mystic-deep/60">
                      <Icon className="w-7 h-7 text-mystic-gold" strokeWidth={1.5} />
                    </div>

                    <p className="font-[family-name:var(--font-cormorant)] text-lg font-medium text-mystic-gold-light mb-1">
                      {point.title}
                    </p>

                    <p className="font-[family-name:var(--font-cormorant)] text-xl font-medium text-mystic-text italic leading-snug">
                      &laquo;{point.quote}&raquo;
                    </p>

                    <p className="text-mystic-text/80 text-sm leading-relaxed">
                      {point.body}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
