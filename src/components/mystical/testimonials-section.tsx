"use client";

import { motion, type Variants } from "framer-motion";
import { Star } from "lucide-react";

const reviews = [
  {
    text: "Анна помогла мне разобраться в сложной жизненной ситуации. Расклад был поразительно точным, и советы оказались действительно полезными. Уже третий раз обращаюсь и каждый раз ухожу с ясным пониманием следующего шага.",
    author: "Анна К.",
    tag: "Постоянный клиент",
  },
  {
    text: "Натальная карта, которую составила Анна, открыла мне глаза на многие вещи. Я поняла свои сильные стороны и направления для развития. Очень профессиональный и душевный подход.",
    author: "Мария Д.",
    tag: "Консультация по натальной карте",
  },
  {
    text: "Гадание на рунах было удивительно точным. Анна не просто прочитала значения — она помогла мне увидеть связь между прошлым, настоящим и будущим. Рекомендую всем!",
    author: "Ольга С.",
    tag: "Гадание на рунах",
  },
];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="relative py-24 sm:py-32 bg-mystic-deep">
      <div className="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[400px] bg-mystic-purple/8 blur-3xl" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Люкс-шапка секции: надзаголовок с линиями + серифная фольга + орнаментальный разделитель */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center mb-16 sm:mb-20"
        >
          <p className="lux-eyebrow lux-eyebrow-lines">Отзывы</p>
          <h2 className="font-[family-name:var(--font-cormorant)] text-3xl sm:text-4xl md:text-5xl font-medium text-gold-foil text-balance mt-5 mb-6">
            Что говорят мои клиенты
          </h2>
          <div className="lux-divider max-w-[280px] sm:max-w-xs mx-auto" aria-hidden="true">
            <span />
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
        >
          {reviews.map((review) => (
            <motion.div key={review.author} variants={cardVariants} className="h-full">
              <div className="lux-card rounded-xl h-full">
                <div className="flex flex-col h-full p-6 sm:p-8">
                  {/* Серифная кавычка-фольга вместо иконки */}
                  <span
                    aria-hidden="true"
                    className="select-none font-[family-name:var(--font-cormorant)] text-5xl leading-none text-gold-foil mb-3"
                  >
                    &laquo;
                  </span>
                  <p className="text-mystic-text text-sm leading-relaxed flex-1 mb-5">
                    {review.text}&raquo;
                  </p>
                  <div className="flex items-center gap-1 mb-5" aria-hidden="true">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-3.5 h-3.5 text-mystic-gold"
                        fill="currentColor"
                        strokeWidth={1}
                      />
                    ))}
                  </div>
                  <div className="border-t border-mystic-gold/10 pt-4">
                    <p className="text-gold-foil font-medium text-sm">{review.author}</p>
                    <p className="text-mystic-text-dim text-xs mt-1">{review.tag}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
