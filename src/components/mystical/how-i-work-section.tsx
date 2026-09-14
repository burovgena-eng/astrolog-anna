'use client';

import { motion, type Variants } from 'framer-motion';
import { FileText, MessageCircle, Video, CheckCircle } from 'lucide-react';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
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

const steps = [
  {
    number: 1,
    title: 'Оставляете заявку',
    body: 'Заполняете простую форму — только имя и Telegram, Max или телефон.',
    icon: FileText,
  },
  {
    number: 2,
    title: 'Я связываюсь с вами',
    body: 'Пишу в течение рабочего дня, уточняю ваш запрос и предлагаю удобное время.',
    icon: MessageCircle,
  },
  {
    number: 3,
    title: 'Проводим консультацию',
    body: 'Встречаемся онлайн в Telegram, Max, Zoom или по телефону. Вы задаёте вопросы — я даю разбор и рекомендации.',
    icon: Video,
  },
  {
    number: 4,
    title: 'Вы получаете план действий',
    body: 'После консультации вы уходите с конкретными шагами и пониманием, что делать дальше.',
    icon: CheckCircle,
  },
];

export function HowIWorkSection() {
  return (
    <section id="how-i-work" className="py-24 sm:py-32 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-1/3 -right-48 w-[500px] h-[500px] bg-mystic-purple blur-3xl rounded-full opacity-15" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Люкс-шапка секции: надзаголовок с линиями + серифная фольга + орнаментальный разделитель */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-center mb-16 sm:mb-20"
        >
          <p className="lux-eyebrow lux-eyebrow-lines">Процесс</p>
          <h2 className="font-[family-name:var(--font-cormorant)] text-4xl sm:text-5xl font-medium text-gold-foil text-balance mt-5 mb-6">
            4 простых шага к ясности
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
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative"
        >
          {/* Connecting hairlines (hidden on mobile), выровнены по центру кругов с номером */}
          <div className="hidden lg:block absolute top-[2.875rem] left-[calc(12.5%+1.5rem)] right-[calc(12.5%+1.5rem)] h-px bg-gradient-to-r from-transparent via-mystic-gold/25 to-transparent" />
          <div className="hidden sm:block lg:hidden absolute top-[2.875rem] left-[calc(25%+1.5rem)] right-[calc(25%+1.5rem)] h-px bg-gradient-to-r from-transparent via-mystic-gold/25 to-transparent" />

          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                variants={cardVariants}
                className="relative flex flex-col items-center"
              >
                <div className="lux-card rounded-xl p-6 text-center flex flex-col items-center gap-4 w-full">
                  {/* Step number: серифная фольга в тонком круге */}
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-mystic-gold/25 bg-mystic-deep/60 relative z-10">
                    <span className="lux-numeral text-gold-foil text-xl leading-none">
                      {step.number}
                    </span>
                  </div>

                  {/* Icon */}
                  <Icon className="w-5 h-5 text-mystic-gold/70" strokeWidth={1.5} />

                  <h3 className="font-[family-name:var(--font-cormorant)] text-xl font-medium text-mystic-text">
                    {step.title}
                  </h3>

                  <p className="text-mystic-text-dim text-sm leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
