"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Мистическое свечение за курсором (только десктоп, pointer: fine).
 * — Большой радиальный золотой ореол ~300px следует за курсором с плавным лагом (lerp в rAF).
 * — Маленькая золотая точка 6px точно под курсором (без лага).
 * Нативный курсор остаётся видимым (доступность).
 */
export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  // Включаем только на устройствах с точным указателем (не тач)
  useEffect(() => {
    const fineMq = window.matchMedia("(pointer: fine)");
    const coarseMq = window.matchMedia("(pointer: coarse)");

    function update() {
      setEnabled(fineMq.matches && !coarseMq.matches);
    }

    update();
    fineMq.addEventListener("change", update);
    coarseMq.addEventListener("change", update);
    return () => {
      fineMq.removeEventListener("change", update);
      coarseMq.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const glow = glowRef.current;
    const dot = dotRef.current;
    if (!glow || !dot) return;

    let rafId = 0;
    const target = { x: -400, y: -400 };
    const pos = { x: -400, y: -400 };
    const LERP = 0.12;

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      // Точка — без лага
      dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      // Ореол появляется при первом движении
      glow.style.opacity = "1";
    };

    const loop = () => {
      pos.x += (target.x - pos.x) * LERP;
      pos.y += (target.y - pos.y) * LERP;
      glow.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      rafId = requestAnimationFrame(loop);
    };

    const onLeave = () => {
      glow.style.opacity = "0";
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(rafId);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      {/* Большой мягкий ореол с лагом.
          z-[35]: НАД контентом страницы (main имеет z-10 — иначе секции с непрозрачными
          фонами «разрезают» свечение), но ПОД навбаром (z-50), чатом (z-[70]) и прогресс-баром (z-[60]).
          mix-blend-mode: screen мягко подсвечивает всё под курсором, как свет свечи. */}
      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[35] h-[420px] w-[420px] rounded-full opacity-0 transition-opacity duration-700 will-change-transform"
        style={{
          background:
            "radial-gradient(circle, rgba(201, 168, 76, 0.055) 0%, rgba(201, 168, 76, 0.028) 32%, rgba(201, 168, 76, 0.012) 55%, transparent 72%)",
          mixBlendMode: "screen",
        }}
      />
      {/* Точная точка под курсором — под навбаром (z-50), чтобы не висела над его ссылками */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[36] h-1 w-1 rounded-full bg-mystic-gold-light/90 opacity-0 transition-opacity duration-500 will-change-transform"
        style={{ boxShadow: "0 0 8px rgba(230, 207, 154, 0.65)" }}
      />
    </>
  );
}
