"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";

interface AnimatedCounterProps {
  end: number;
  suffix?: string;
  duration?: number;
  /** Запустить анимацию сразу при монтировании (для первого экрана, где блок у нижней кромки вьюпорта). */
  immediate?: boolean;
}

/**
 * Анимированный счётчик: считает от 0 до end при появлении в вьюпорте.
 * Формат — ru-локаль с пробелами (3 000). Итоговое значение доступно
 * скринридерам через sr-only, анимация скрыта aria-hidden.
 */
export function AnimatedCounter({ end, suffix = "", duration = 2, immediate = false }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!immediate && !isInView) return;

    const controls = animate(0, end, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => setValue(Math.round(latest)),
    });

    return () => controls.stop();
  }, [immediate, isInView, end, duration]);

  const formatter = new Intl.NumberFormat("ru-RU");
  const current = formatter.format(value);
  const final = formatter.format(end);

  return (
    <span ref={ref} className="tabular-nums">
      <span aria-hidden="true">
        {current}
        {suffix}
      </span>
      <span className="sr-only">
        {final}
        {suffix}
      </span>
    </span>
  );
}
