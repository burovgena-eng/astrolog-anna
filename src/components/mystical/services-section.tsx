"use client";

import { motion, type Variants } from "framer-motion";
import { Check, Zap, Star, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TARIFFS, type Tariff } from "@/lib/services";

const ICONS: Record<Tariff["icon"], typeof Zap> = {
  zap: Zap,
  star: Star,
  crown: Crown,
};

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14 } },
};
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

export function ServicesSection() {
  function scrollTo(href: string) {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  /** Записаться на конкретный тариф: форма записи сразу откроется с ним. */
  function bookTariff(tariffName: string) {
    window.dispatchEvent(new CustomEvent("anna:select-tariff", { detail: tariffName }));
    scrollTo("#booking");
  }

  return (
    <section id="services" className="relative py-24 sm:py-32 bg-mystic-deep">
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-glow-purple rounded-full opacity-20 blur-3xl" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Люкс-шапка секции: надзаголовок с линиями + серифная фольга + орнаментальный разделитель */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center mb-16 sm:mb-20"
        >
          <p className="lux-eyebrow lux-eyebrow-lines">Услуги</p>
          <h2 className="font-[family-name:var(--font-cormorant)] text-3xl sm:text-4xl md:text-5xl font-medium text-gold-foil text-balance mt-5 mb-6">
            Выберите подходящий формат
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
          className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-8"
        >
          {TARIFFS.map((pkg) => {
            const Icon = ICONS[pkg.icon];
            return (
              <motion.div key={pkg.name} variants={cardVariants} className="h-full">
                <div
                  className={`lux-card rounded-xl flex flex-col h-full ${pkg.popular ? "lux-corners" : ""}`}
                  style={pkg.popular ? { borderColor: "rgba(200, 167, 94, 0.38)" } : undefined}
                >
                  {pkg.popular && (
                    <div
                      aria-hidden="true"
                      className="absolute -inset-5 rounded-2xl bg-glow-gold opacity-[0.13] blur-3xl pointer-events-none"
                    />
                  )}

                  {/* Парящая капсула «Самый популярный» по верхней кромке */}
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                      <span
                        className="glass-strong inline-flex items-center rounded-full px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.26em] text-mystic-gold-light whitespace-nowrap"
                        style={{ borderColor: "rgba(200, 167, 94, 0.5)" }}
                      >
                        Самый популярный
                      </span>
                    </div>
                  )}

                  <div className="relative z-10 flex flex-col h-full p-6 sm:p-8">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-mystic-gold/25 bg-mystic-deep/60 mb-6">
                      <Icon className="h-[22px] w-[22px] text-mystic-gold" strokeWidth={1.5} />
                    </div>

                    <h3 className="font-[family-name:var(--font-cormorant)] text-2xl sm:text-3xl font-medium text-mystic-text mb-1.5">
                      {pkg.name}
                    </h3>
                    <p className="text-mystic-text-dim text-sm mb-5">{pkg.duration}</p>

                    <p className="lux-numeral text-gold-foil text-4xl leading-none mb-5">
                      {pkg.price}
                    </p>

                    <p className="text-mystic-text text-sm leading-relaxed mb-5">
                      {pkg.description}
                    </p>

                    <div className="space-y-2.5 mb-6">
                      {pkg.details.map((d) => (
                        <p key={d} className="text-mystic-text/75 text-sm leading-relaxed">{d}</p>
                      ))}
                    </div>

                    <div className="border-t border-mystic-gold/10 pt-5 mb-6 flex-1">
                      <p className="text-mystic-gold/70 text-[10px] uppercase tracking-[0.24em] mb-2">Что входит:</p>
                      <ul>
                        {pkg.includes.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2.5 py-2.5 text-mystic-text/85 text-sm leading-relaxed border-b border-mystic-gold/8 last:border-b-0"
                          >
                            <Check className="w-4 h-4 text-mystic-gold shrink-0 mt-0.5" strokeWidth={1.5} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-auto">
                      <p className="text-mystic-text-dim text-xs mb-4">Формат: {pkg.format}</p>
                      {pkg.popular ? (
                        <Button
                          onClick={() => bookTariff(pkg.name)}
                          className="lux-btn-gold w-full rounded-full h-11 px-8 text-[12px] uppercase tracking-[0.16em] font-semibold"
                        >
                          Записаться
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          onClick={() => bookTariff(pkg.name)}
                          className="w-full rounded-full h-11 px-8 text-[12px] uppercase tracking-[0.16em] font-semibold border border-mystic-gold/25 bg-transparent text-mystic-gold hover:border-mystic-gold/50 hover:bg-mystic-gold/5 hover:text-mystic-gold-light"
                        >
                          Записаться
                        </Button>
                      )}
                    </div>
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
