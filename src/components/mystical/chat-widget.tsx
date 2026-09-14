"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkle, X, Send, MoonStar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Здравствуйте! Я Анна, астролог и таролог. Спросите меня о картах, рунах, знаках зодиака или лунных днях — расскажу, что значат эти знаки.",
};

const QUICK_QUESTIONS = [
  "Что значит карта Колесница?",
  "Что расскажет мой знак зодиака?",
  "Как выбрать день для важного дела?",
  "Мне сегодня приснился странный сон…",
];

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showChips, setShowChips] = useState(true);
  const [isFabHidden, setIsFabHidden] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  // Умная кнопка: прячется при скролле вниз (не перекрывает текст),
  // возвращается при скролле вверх; у верха страницы всегда видна.
  useEffect(() => {
    if (isOpen) {
      setIsFabHidden(false);
      return;
    }
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        const delta = y - lastScrollY.current;
        lastScrollY.current = y;
        if (y < 140) {
          setIsFabHidden(false);
        } else if (delta > 6) {
          setIsFabHidden(true);
        } else if (delta < -6) {
          setIsFabHidden(false);
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 350);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const nextMessages: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setShowChips(false);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages
            .filter((m) => m !== WELCOME)
            .slice(-12),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.reply) throw new Error(data.error || "error");
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Звёзды сейчас молчат — связь с космосом прервалась. Попробуйте ещё раз через минуту.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void send(input);
  }

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6 }}
            animate={isFabHidden ? { opacity: 0, scale: 0.7, y: 76 } : { opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={() => setIsOpen(true)}
            aria-label="Открыть чат «Вопрос звёздам»"
            aria-hidden={isFabHidden}
            tabIndex={isFabHidden ? -1 : 0}
            className="fixed bottom-5 right-5 z-[70] flex h-14 w-14 items-center justify-center rounded-full border border-mystic-gold/40 bg-mystic-surface/90 shadow-[0_10px_32px_rgba(0,0,0,0.5)] backdrop-blur-md transition-colors duration-300 hover:border-mystic-gold/60"
          >
            <Sparkle className="h-6 w-6 text-mystic-gold" />
            <span
              aria-hidden
              className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-mystic-gold shadow-[0_0_6px_rgba(201,168,76,0.8)]"
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            role="dialog"
            aria-label="Чат «Вопрос звёздам»"
            className="fixed bottom-5 right-5 z-[70] flex h-[min(560px,calc(100dvh-40px))] w-[min(380px,calc(100vw-40px))] flex-col overflow-hidden rounded-2xl glass-strong border-gold-shimmer shadow-[0_10px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(201,168,76,0.12)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-mystic-gold/15 bg-mystic-surface/60 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-mystic-gold/40 bg-glow-gold">
                  <MoonStar className="h-5 w-5 text-mystic-gold" />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-mystic-surface bg-emerald-400" />
                </div>
                <div>
                  <p className="font-[family-name:var(--font-cormorant)] text-lg font-semibold text-gold-gradient leading-tight">
                    Вопрос звёздам
                  </p>
                  <p className="text-[11px] text-mystic-text-dim">
                    Анна отвечает онлайн
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Закрыть чат"
                className="rounded-lg p-2 text-mystic-text-dim transition-colors hover:bg-mystic-gold/10 hover:text-mystic-gold"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              role="log"
              aria-live="polite"
              className="flex-1 space-y-3 overflow-y-auto px-4 py-4 scroll-smooth"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "rounded-br-sm bg-gold-gradient text-mystic-deep font-medium"
                        : "rounded-bl-sm border border-mystic-purple/20 bg-mystic-surface-light/80 text-mystic-text"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-mystic-purple/20 bg-mystic-surface-light/80 px-4 py-3">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-mystic-gold/70"
                        style={{ animationDelay: `${d * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quick questions */}
              {showChips && messages.length <= 2 && !isLoading && (
                <div className="flex flex-col gap-2 pt-1">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => void send(q)}
                      className="w-fit max-w-full rounded-full border border-mystic-gold/25 bg-mystic-surface/70 px-3.5 py-2 text-left text-xs text-mystic-text-dim transition-all hover:border-mystic-gold/50 hover:text-mystic-gold"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 border-t border-mystic-gold/15 bg-mystic-surface/60 px-3 py-3"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ваш вопрос звёздам…"
                maxLength={500}
                aria-label="Текст вопроса"
                className="flex-1 bg-mystic-surface/80 border-mystic-purple/20 text-mystic-text placeholder:text-mystic-text-dim/50 focus:border-mystic-gold/60 focus:ring-mystic-gold/30"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                aria-label="Отправить сообщение"
                className="h-10 w-10 shrink-0 rounded-full bg-gold-gradient text-mystic-deep hover:opacity-90 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="pb-2 text-center text-[10px] text-mystic-text-dim/50">
              Развлекательный формат. ИИ-ассистент, не заменяет личную консультацию.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
