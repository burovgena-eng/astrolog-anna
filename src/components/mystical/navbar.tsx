"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { label: "Услуги", href: "#services" },
  { label: "Карта дня", href: "#card-of-day" },
  { label: "Гадание", href: "#three-cards" },
  { label: "Прогноз", href: "#horoscope" },
  { label: "Обо мне", href: "#about" },
  { label: "Отзывы", href: "#testimonials" },
  { label: "Блог", href: "#blog" },
  { label: "Вопросы", href: "#faq" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 50);
    }
    handleScroll(); // синхронизация при монтировании (восстановление скролла после reload)
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Подсветка активной секции через IntersectionObserver
  useEffect(() => {
    const sectionIds = NAV_LINKS.map((link) => link.href.slice(1));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      // Узкая зона в верхней трети вьюпорта — секция «активна», когда её заголовок у навигации
      { rootMargin: "-30% 0px -60% 0px" }
    );

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  function scrollTo(href: string) {
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileOpen(false);
  }

  function isActive(href: string) {
    return activeSection === href.slice(1);
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "glass-strong py-2"
          : "bg-transparent py-4"
      }`}
    >
      <nav className="container mx-auto px-4 sm:px-6 flex items-center justify-between">
        <button
          onClick={() => scrollTo("#hero")}
          className="flex items-center gap-2.5 group shrink-0"
          aria-label="Астролог Анна — на главную"
        >
          <Moon className="w-5 h-5 text-mystic-gold group-hover:rotate-12 transition-transform duration-500" strokeWidth={1.5} />
          {/* Task 29: люкс-лого — имя крупно + микроподпись (была длинная строка с переносом) */}
          <span className="flex flex-col items-start leading-none">
            <span className="font-[family-name:var(--font-cormorant)] text-[22px] sm:text-2xl font-semibold tracking-[0.08em] text-gold-foil">
              Анна
            </span>
            <span className="mt-1 text-[9px] uppercase tracking-[0.32em] text-mystic-text-dim/80">
              Астрология · Таро
            </span>
          </span>
        </button>

        <div className="hidden lg:flex items-center gap-0.5">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                aria-current={active ? "true" : undefined}
                className={`relative whitespace-nowrap px-2.5 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors duration-300 ${
                  active
                    ? "text-mystic-gold"
                    : "text-mystic-text-dim hover:text-mystic-gold"
                }`}
              >
                {link.label}
                <span
                  aria-hidden="true"
                  className={`absolute left-1/2 -translate-x-1/2 bottom-0 h-px w-4 bg-gradient-to-r from-transparent via-mystic-gold to-transparent transition-all duration-300 ${
                    active ? "opacity-100 w-6" : "opacity-0"
                  }`}
                />
              </button>
            );
          })}
          <Button
            onClick={() => scrollTo("#booking")}
            className="lux-btn-gold ml-3 rounded-full px-5 text-[11px] tracking-[0.18em] uppercase font-semibold"
          >
            Записаться
          </Button>
        </div>

        <button
          className="lg:hidden p-2 text-mystic-gold"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label={isMobileOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={isMobileOpen}
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden glass-strong overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((link) => {
                const active = isActive(link.href);
                return (
                  <button
                    key={link.href}
                    onClick={() => scrollTo(link.href)}
                    aria-current={active ? "true" : undefined}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      active
                        ? "text-mystic-gold bg-mystic-gold/10"
                        : "text-mystic-text-dim hover:text-mystic-gold hover:bg-mystic-gold/5"
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
              <Button
                onClick={() => scrollTo("#booking")}
                className="lux-btn-gold mt-2 w-full rounded-full font-semibold"
              >
                Записаться
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
