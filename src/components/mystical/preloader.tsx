"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const SEEN_KEY = "mystic-preloader-seen";
const MAX_DURATION_MS = 1800;
const FADE_MS = 600;

type Phase = "visible" | "fading" | "done";

/* Читаем флаг сессии как «внешнее хранилище» — безопасно для гидратации:
   на сервере считаем прелоадер увиденным (SSR-разметка без оверлея),
   после гидратации на клиенте снимок перечитывается из sessionStorage. */
function subscribeToSession() {
  return () => {};
}

function hasSeenThisSession(): boolean {
  try {
    return sessionStorage.getItem(SEEN_KEY) !== null;
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  return true;
}

/**
 * Мистический прелоадер: рисующийся полумесяц + «Звёзды выравниваются…».
 * Показывается один раз за сессию (sessionStorage), скрывается
 * по window load или максимум через 1.8 с, затем размонтируется
 * и не блокирует взаимодействие (pointer-events-none + unmount).
 */
export function Preloader() {
  const alreadySeen = useSyncExternalStore(
    subscribeToSession,
    hasSeenThisSession,
    getServerSnapshot
  );
  const [phase, setPhase] = useState<Phase>("visible");
  const finishingRef = useRef(false);

  useEffect(() => {
    if (alreadySeen) return;

    let fadeTimer: ReturnType<typeof setTimeout> | undefined;
    let unmountTimer: ReturnType<typeof setTimeout> | undefined;

    const finish = () => {
      if (finishingRef.current) return;
      finishingRef.current = true;
      setPhase("fading");
      // Флаг сессии ставим только после полного исчезновения,
      // чтобы снапшот не размонтировал оверлей раньше плавного фейда
      unmountTimer = setTimeout(() => {
        try {
          sessionStorage.setItem(SEEN_KEY, "1");
        } catch {
          // sessionStorage недоступен — игнорируем
        }
        setPhase("done");
      }, FADE_MS + 100);
    };

    if (document.readyState === "complete") {
      // Страница уже загружена — короткая заставка
      fadeTimer = setTimeout(finish, 800);
    } else {
      window.addEventListener("load", finish, { once: true });
      fadeTimer = setTimeout(finish, MAX_DURATION_MS);
    }

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
      window.removeEventListener("load", finish);
    };
  }, [alreadySeen]);

  if (alreadySeen || phase === "done") return null;

  const isFading = phase === "fading";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={isFading}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-mystic-deep transition-opacity ease-out ${
        isFading ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      {/* Рисующийся золотой полумесяц */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="0.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-24 w-24 drop-shadow-[0_0_18px_rgba(201,168,76,0.45)]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="preloader-moon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e8d48b" />
            <stop offset="55%" stopColor="#c9a84c" />
            <stop offset="100%" stopColor="#8b7535" />
          </linearGradient>
        </defs>
        <path
          d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"
          stroke="url(#preloader-moon-gradient)"
          className="preloader-moon-path"
        />
      </svg>

      <p className="flex items-baseline gap-1 text-sm uppercase tracking-[0.3em] text-mystic-text-dim">
        Звёзды выравниваются
        <span aria-hidden="true" className="text-mystic-gold">
          <span className="preloader-dot">.</span>
          <span className="preloader-dot" style={{ animationDelay: "0.2s" }}>.</span>
          <span className="preloader-dot" style={{ animationDelay: "0.4s" }}>.</span>
        </span>
        <span className="sr-only">…</span>
      </p>
    </div>
  );
}
