"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  /** Коэффициент параллакса (0.4–1): чем меньше звезда, тем глубже она «в фоне» */
  depth: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number; // px/сек
  vy: number; // px/сек
  life: number; // оставшееся время, мс
  maxLife: number; // 800–1200 мс
  trail: number; // длина хвоста, px
}

const STAR_COUNT = 200;
const MAX_SHOOTING_STARS = 2;
const SHOOTING_STAR_MIN_GAP_MS = 3000;
const SHOOTING_STAR_MAX_GAP_MS = 7000;
const SCROLL_PARALLAX_FACTOR = 0.05;

export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let animationId = 0;
    let lastTime = performance.now();
    let nextShootingStarAt = performance.now() + 2000;
    const stars: Star[] = [];
    const shootingStars: ShootingStar[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createStars = () => {
      stars.length = 0;
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.8 + 0.2,
          speed: Math.random() * 0.3 + 0.05,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinkleOffset: Math.random() * Math.PI * 2,
          depth: 0.4 + Math.random() * 0.6,
        });
      }
    };

    // Падающая звезда: старт в верхней части экрана, диагональный полёт
    const spawnShootingStar = () => {
      const duration = 800 + Math.random() * 400; // 0.8–1.2 с
      const speed = 420 + Math.random() * 260; // px/сек
      const angle = ((20 + Math.random() * 20) * Math.PI) / 180; // 20–40° вниз
      const direction = Math.random() > 0.5 ? 1 : -1;
      const w = canvas.width;

      shootingStars.push({
        x: direction === 1 ? Math.random() * w * 0.6 : w * 0.4 + Math.random() * w * 0.6,
        y: Math.random() * canvas.height * 0.6, // верхние 60% экрана
        vx: Math.cos(angle) * speed * direction,
        vy: Math.sin(angle) * speed,
        life: duration,
        maxLife: duration,
        trail: 90 + Math.random() * 70,
      });
    };

    const updateShootingStars = (dt: number, now: number) => {
      if (
        !prefersReducedMotion &&
        now >= nextShootingStarAt &&
        shootingStars.length < MAX_SHOOTING_STARS
      ) {
        spawnShootingStar();
        nextShootingStarAt =
          now +
          SHOOTING_STAR_MIN_GAP_MS +
          Math.random() * (SHOOTING_STAR_MAX_GAP_MS - SHOOTING_STAR_MIN_GAP_MS);
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        s.life -= dt;
        s.x += (s.vx * dt) / 1000;
        s.y += (s.vy * dt) / 1000;
        if (s.life <= 0) shootingStars.splice(i, 1);
      }
    };

    const drawShootingStars = () => {
      for (const s of shootingStars) {
        const progress = 1 - s.life / s.maxLife; // 0 → 1
        // Плавное появление в начале и затухание в конце
        const alpha =
          progress < 0.15
            ? progress / 0.15
            : Math.max(0, 1 - (progress - 0.6) / 0.4);

        const speed = Math.hypot(s.vx, s.vy);
        const tailX = s.x - (s.vx / speed) * s.trail;
        const tailY = s.y - (s.vy / speed) * s.trail;

        // Затухающий золотой хвост
        const gradient = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
        gradient.addColorStop(0, `rgba(232, 212, 139, ${0.9 * alpha})`);
        gradient.addColorStop(0.35, `rgba(201, 168, 76, ${0.5 * alpha})`);
        gradient.addColorStop(1, "rgba(201, 168, 76, 0)");

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        // Яркая золотая голова
        ctx.fillStyle = `rgba(240, 222, 160, ${alpha})`;
        ctx.shadowColor = `rgba(201, 168, 76, ${0.8 * alpha})`;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    const drawStars = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Лёгкий параллакс: всё небо слегка смещается при скролле
      const scrollOffset = window.scrollY * SCROLL_PARALLAX_FACTOR;
      const range = canvas.height + 10;

      for (const star of stars) {
        const twinkle =
          Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.5 + 0.5;
        const alpha = star.opacity * (0.3 + twinkle * 0.7);

        // Смещение по глубине звезды с заворачиванием по экрану
        const rawY = (star.y - scrollOffset * star.depth) % range;
        const py = ((rawY + range) % range) - 5;

        // Gold stars
        const goldChance = star.size > 1.5;
        if (goldChance) {
          ctx.fillStyle = `rgba(201, 168, 76, ${alpha})`;
          // Glow effect for bigger stars
          ctx.shadowColor = "rgba(201, 168, 76, 0.5)";
          ctx.shadowBlur = star.size * 3;
        } else {
          ctx.fillStyle = `rgba(226, 213, 241, ${alpha})`;
          ctx.shadowColor = "rgba(226, 213, 241, 0.3)";
          ctx.shadowBlur = star.size * 2;
        }

        ctx.beginPath();
        ctx.arc(star.x, py, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Slow drift
        star.y -= star.speed * 0.1;
        star.x += Math.sin(time * 0.0005 + star.twinkleOffset) * 0.05;

        if (star.y < -5) {
          star.y = canvas.height + 5;
          star.x = Math.random() * canvas.width;
        }
      }
      ctx.shadowBlur = 0;
    };

    const animate = (now: number) => {
      const dt = Math.min(now - lastTime, 50); // защита от больших скачков
      lastTime = now;

      updateShootingStars(dt, now);
      drawStars(now);
      drawShootingStars();

      animationId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      resize();
      createStars();
    };

    resize();
    createStars();
    animationId = requestAnimationFrame(animate);
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
