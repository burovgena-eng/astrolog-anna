import { Moon, Mail, Send, Lock } from "lucide-react";

const navLinks = [
  { label: "Услуги", href: "#services" },
  { label: "Обо мне", href: "#about" },
  { label: "Отзывы", href: "#testimonials" },
  { label: "Записаться", href: "#booking" },
] as const;

export function Footer() {
  return (
    <footer className="relative mt-auto">
      {/* Верхняя световая кромка */}
      <div aria-hidden="true" className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-mystic-gold/40 to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(200,167,94,0.05),transparent_70%)]" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-18">
        {/* Three-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 sm:gap-12">
          {/* Column 1 — Logo & description */}
          <div className="flex flex-col gap-5">
            <a href="#hero" className="inline-flex items-center gap-2.5 group w-fit" aria-label="Астролог Анна — наверх">
              <Moon className="w-5 h-5 text-mystic-gold transition-transform duration-500 group-hover:rotate-12" strokeWidth={1.5} />
              <span className="flex flex-col items-start leading-none">
                <span className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold tracking-[0.08em] text-gold-foil">Анна</span>
                <span className="mt-1 text-[9px] uppercase tracking-[0.32em] text-mystic-text-dim/80">Астрология · Таро</span>
              </span>
            </a>
            <p className="text-sm leading-relaxed text-mystic-text-dim max-w-xs">
              Астрология, Таро, руны и нумерология — ваш путеводитель по звёздам и самому себе.
            </p>
          </div>

          {/* Column 2 — Navigation */}
          <div className="flex flex-col gap-5">
            <h3 className="lux-eyebrow">Навигация</h3>
            <nav>
              <ul className="flex flex-col gap-3">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="group inline-flex items-center gap-2 text-sm text-mystic-text-dim hover:text-mystic-gold transition-colors"
                    >
                      <span aria-hidden="true" className="h-px w-0 bg-mystic-gold/70 transition-all duration-300 group-hover:w-3" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Column 3 — Contacts */}
          <div className="flex flex-col gap-5">
            <h3 className="lux-eyebrow">Контакты</h3>

            <ul className="flex flex-col gap-3 text-sm text-mystic-text-dim">
              <li className="inline-flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-mystic-gold/60 shrink-0" strokeWidth={1.5} />
                anna@luna-stars.ru
              </li>
              <li className="inline-flex items-center gap-2.5">
                <Send className="w-4 h-4 text-mystic-gold/60 shrink-0" strokeWidth={1.5} />
                Telegram: @luna_stars_astro
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar — орнаментальный разделитель */}
        <div className="lux-divider mt-12 mb-6" aria-hidden="true">
          <span />
        </div>
        <div className="flex items-center justify-center gap-3">
          <p className="text-xs tracking-[0.08em] text-mystic-text-dim/80">
            © {new Date().getFullYear()} Астролог Анна · Таро и Руны. Все права защищены.
          </p>
          <a
            href="/admin"
            aria-label="Панель управления"
            title="Панель управления"
            className="shrink-0 inline-flex items-center text-mystic-text-dim/30 hover:text-mystic-gold/70 transition-colors"
          >
            <Lock className="w-3 h-3" strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </footer>
  );
}
