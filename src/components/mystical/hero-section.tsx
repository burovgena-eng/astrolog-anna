"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";
import { ArrowDown, Sparkle, Moon, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/mystical/animated-counter";
import Image from "next/image";

const STATS = [
  { end: 10, suffix: "+", label: "лет практики" },
  { end: 3000, suffix: "+", label: "консультаций" },
  { end: 500, suffix: "+", label: "отзывов" },
];

const FLOATING_ICONS = [
  { Icon: Sparkle, className: "top-[20%] left-[8%]", delay: "0s", size: "w-6 h-6" },
  { Icon: Moon, className: "top-[28%] right-[10%]", delay: "1.5s", size: "w-8 h-8" },
  { Icon: Star, className: "bottom-[32%] left-[14%]", delay: "3s", size: "w-5 h-5" },
];

export function HeroSection() {
  function scrollTo(href: string) {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-28 pb-28">
      <div className="absolute inset-0 z-0">
        <Image src="/images/hero-bg-lux.png" alt="" fill className="object-cover opacity-30" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-mystic-deep/60 via-mystic-deep/40 to-mystic-deep" />
      </div>

      <div className="absolute top-20 left-10 w-2 h-2 bg-mystic-gold rounded-full animate-twinkle" />
      <div className="absolute top-40 right-20 w-1.5 h-1.5 bg-mystic-gold-light rounded-full animate-twinkle [animation-delay:1s]" />
      <div className="absolute bottom-40 left-1/4 w-1 h-1 bg-mystic-lavender rounded-full animate-twinkle [animation-delay:2s]" />
      <div className="absolute top-1/3 right-1/3 w-2.5 h-2.5 bg-mystic-purple-light rounded-full animate-pulse opacity-40" />

      {/* Парящие мистические иконки — скрыты на маленьких экранах */}
      {FLOATING_ICONS.map(({ Icon, className, delay, size }, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 + i * 0.3, duration: 1.2 }}
          className={`absolute z-10 hidden lg:block pointer-events-none ${className}`}
          aria-hidden="true"
        >
          <div className="animate-float" style={{ animationDelay: delay }}>
            <Icon className={`${size} text-mystic-gold/50 drop-shadow-[0_0_10px_rgba(201,168,76,0.4)]`} />
          </div>
        </motion.div>
      ))}

      {/* Task 30: люкс-рамка закреплена к СЕКЦИИ (не к контенту) — при любой высоте
          контента сохраняет ≥16px зазора до текста сверху/снизу и не пересекает h1 */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 1 }}
        className="pointer-events-none absolute inset-x-4 lg:inset-x-8 top-24 bottom-24 hidden md:block"
      >
        <div className="absolute inset-0 border border-mystic-gold/12" />
        <div className="absolute -top-px -left-px w-8 h-8 border-t border-l border-mystic-gold/45" />
        <div className="absolute -top-px -right-px w-8 h-8 border-t border-r border-mystic-gold/45" />
        <div className="absolute -bottom-px -left-px w-8 h-8 border-b border-l border-mystic-gold/45" />
        <div className="absolute -bottom-px -right-px w-8 h-8 border-b border-r border-mystic-gold/45" />
      </motion.div>

      {/* w-full: flex-элемент не раздувается до min-content (nowrap-CTA) — иначе на ≤430px
          контейнер вылезает за экран и h1 срезается по краям (Task 30) */}
      <div className="relative z-10 w-full text-center px-4 sm:px-6 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
          <div className="flex items-center justify-center gap-4 mb-8" aria-hidden="true">
            <span className="h-px w-6 sm:w-16 bg-gradient-to-r from-transparent to-mystic-gold/50" />
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] sm:tracking-[0.4em] text-mystic-gold/90 font-medium pl-[0.22em] sm:pl-[0.4em] whitespace-nowrap">Астрология · Таро · Руны</span>
            <span className="h-px w-6 sm:w-16 bg-gradient-to-l from-transparent to-mystic-gold/50" />
          </div>
          <h1 className="font-[family-name:var(--font-cormorant)] text-[34px] sm:text-5xl md:text-[64px] lg:text-[72px] font-medium leading-[1.14] tracking-[0.01em] text-balance mb-7">
            <span className="text-gold-foil">За 60 минут я разберу вашу ситуацию</span>{" "}
            <span className="text-mystic-text">и дам чёткий план действий</span>{" "}
            <span className="text-mystic-text/75 italic font-normal">— в любви, карьере или самопознании</span>
          </h1>

          <p className="text-base sm:text-lg text-mystic-text-dim max-w-xl mx-auto mb-10 leading-relaxed">
            Я Анна — практикующий астролог, таролог и рунолог. За 10 лет и более 3 000 консультаций я помогла сотням людей выйти из тупика и начать двигаться осознанно.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" onClick={() => scrollTo("#booking")} className="lux-btn-gold rounded-full text-[13px] uppercase tracking-[0.16em] font-semibold px-5 sm:px-10 py-6">
              Записаться на консультацию
            </Button>
          </div>

          {/* Статистика */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
            className="mt-14 flex flex-wrap items-center justify-center gap-x-6 gap-y-6 sm:gap-x-12"
          >
            {STATS.map((stat, i) => (
              <Fragment key={stat.label}>
                {i > 0 && (
                  <div
                    aria-hidden="true"
                    className="hidden sm:block w-px h-12 bg-gradient-to-b from-transparent via-mystic-gold/40 to-transparent"
                  />
                )}
                <div className="flex flex-col items-center gap-1.5">
                  <span className="lux-numeral text-[34px] leading-none text-gold-foil">
                    <AnimatedCounter
                      immediate
                      end={stat.end}
                      suffix={stat.suffix}
                      duration={stat.end > 100 ? 2 : 1.4}
                    />
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.28em] text-mystic-text-dim/90">
                    {stat.label}
                  </span>
                </div>
              </Fragment>
            ))}
          </motion.div>
        </motion.div>

      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1 }} className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <button onClick={() => scrollTo("#pain-points")} className="flex flex-col items-center gap-2 text-mystic-text-dim hover:text-mystic-gold transition-colors" aria-label="Прокрутить вниз">
          <span className="text-xs tracking-widest uppercase">Узнать больше</span>
          <ArrowDown className="w-5 h-5 animate-bounce" />
        </button>
      </motion.div>
    </section>
  );
}
