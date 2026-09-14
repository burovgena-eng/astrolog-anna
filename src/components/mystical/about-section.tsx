"use client";

import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { Clock, Users, MessageSquare } from "lucide-react";

const stats = [
  { icon: Clock, value: "10+", label: "лет практики" },
  { icon: Users, value: "3 000+", label: "консультаций" },
  { icon: MessageSquare, value: "500+", label: "отзывов" },
];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

export function AboutSection() {
  return (
    <section id="about" className="relative py-24 md:py-32 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-mystic-deep via-mystic-deep/95 to-mystic-deep" />
      <div className="pointer-events-none absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-mystic-purple/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div variants={itemVariants} className="flex justify-center lg:justify-end">
            <div className="relative group">
              <div className="absolute -inset-5 rounded-2xl bg-glow-gold opacity-[0.12] blur-2xl transition-opacity duration-700 group-hover:opacity-25" />
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="lux-corners relative rounded-xl p-2"
                style={{
                  border: "1px solid rgba(200, 167, 94, 0.28)",
                  background:
                    "linear-gradient(165deg, rgba(27, 24, 35, 0.9) 0%, rgba(17, 15, 22, 0.94) 100%)",
                  boxShadow:
                    "inset 0 1px 0 rgba(241, 235, 225, 0.05), 0 24px 60px -30px rgba(0, 0, 0, 0.9)",
                }}
              >
                <div className="relative rounded-lg overflow-hidden">
                  <Image src="/images/about-lux.png" alt="Элегантная карта Таро с золотым орнаментом на тёмном шёлке и золотой полумесяц" width={420} height={560} className="w-full h-auto object-cover rounded-lg" priority={false} />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 rounded-lg pointer-events-none"
                    style={{ border: "1px solid rgba(200, 167, 94, 0.22)" }}
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div variants={containerVariants} className="flex flex-col gap-6">
            <motion.div variants={itemVariants}>
              <p className="lux-eyebrow">Обо мне</p>
              <h2 className="font-[family-name:var(--font-cormorant)] text-4xl sm:text-5xl font-medium text-gold-foil leading-tight mt-5">
                Почему мне доверяют
              </h2>
              <div className="lux-divider max-w-[240px] mt-5" aria-hidden="true">
                <span />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4">
              <p className="text-mystic-text text-base sm:text-lg leading-relaxed">
                Меня зовут Анна. Я не предсказываю будущее — я помогаю вам разобраться в настоящем и принять осознанные решения.
              </p>
              <p className="text-mystic-text/85 text-base sm:text-lg leading-relaxed">
                Более 10 лет я практикую астрологию, Таро и руны. За это время провела более 3 000 персональных консультаций. Мой подход — это не абстрактные описания, а конкретика: что происходит, почему, и что с этим делать.
              </p>
              <p className="text-mystic-text/85 text-base sm:text-lg leading-relaxed">
                Я сочетаю классическую астрологию с интуитивным чтением Таро и древней мудростью рун. Каждая консультация — это диалог, в котором вы получаете не готовые ответы, а ясность, чтобы принять решение самостоятельно.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="grid grid-cols-3 gap-3">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="lux-card rounded-xl p-3 sm:p-4 text-center"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-mystic-gold/25 bg-mystic-deep/60">
                          <Icon className="w-3.5 h-3.5 text-mystic-gold" strokeWidth={1.5} />
                        </span>
                        <span className="lux-numeral text-gold-foil text-2xl sm:text-3xl leading-none">
                          {stat.value}
                        </span>
                        <span className="text-mystic-text-dim text-xs sm:text-sm leading-tight">
                          {stat.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
