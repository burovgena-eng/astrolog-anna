"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, Clock, BookOpen, MoonStar, X, CalendarDays, Sparkles } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Markdown } from "@/lib/markdown";

/**
 * Task 24: секция блога на реальных AI-статьях.
 * Список — GET /api/articles?limit=3, чтение — диалог с GET /api/articles/[id],
 * обложки — /api/articles/[id]/cover. Пустая база → мягкий пустой стейт.
 */

interface ArticleListItem {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readMinutes: number;
  createdAt: string;
  hasCover: boolean;
}

interface ArticleFull extends ArticleListItem {
  content: string;
}

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

function formatDateRu(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export function BlogSection() {
  const [articles, setArticles] = useState<ArticleListItem[] | null>(null); // null = загрузка
  const [openId, setOpenId] = useState<string | null>(null);
  const [full, setFull] = useState<ArticleFull | null>(null);
  const [isLoadingFull, setIsLoadingFull] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    try {
      const res = await fetch("/api/articles?limit=3", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { articles?: ArticleListItem[] };
      setArticles(Array.isArray(data.articles) ? data.articles : []);
      setLoadError(null);
    } catch {
      setArticles([]);
      setLoadError("Не удалось загрузить статьи");
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  // Полная статья при открытии диалога
  useEffect(() => {
    if (!openId) {
      setFull(null);
      return;
    }
    let cancelled = false;
    setIsLoadingFull(true);
    fetch(`/api/articles/${openId}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: { article?: ArticleFull }) => {
        if (!cancelled) setFull(data.article ?? null);
      })
      .catch(() => {
        if (!cancelled) setFull(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingFull(false);
      });
    return () => {
      cancelled = true;
    };
  }, [openId]);

  return (
    <section id="blog" className="relative py-24 sm:py-32 bg-mystic-deep">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-mystic-purple rounded-full opacity-15 blur-3xl" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16 sm:mb-20"
        >
          <p className="lux-eyebrow lux-eyebrow-lines">Блог</p>
          <h2 className="font-[family-name:var(--font-cormorant)] text-3xl sm:text-4xl md:text-5xl font-medium text-gold-foil text-balance mt-5 mb-6">
            Блог и знания
          </h2>
          <div className="lux-divider max-w-[280px] sm:max-w-xs mx-auto" aria-hidden="true">
            <span />
          </div>
        </motion.div>

        {/* Состояния */}
        {articles === null ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <Card key={i} className="lux-card overflow-hidden">
                <Skeleton className="h-40 w-full rounded-none bg-mystic-purple/20" />
                <CardContent className="flex flex-col gap-3 pt-6 px-6 pb-4">
                  <Skeleton className="h-5 w-20 rounded-full bg-mystic-purple/20" />
                  <Skeleton className="h-6 w-full bg-mystic-purple/20" />
                  <Skeleton className="h-4 w-full bg-mystic-purple/20" />
                  <Skeleton className="h-4 w-3/4 bg-mystic-purple/20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="lux-card mx-auto max-w-lg rounded-2xl px-6 py-14 text-center">
            <MoonStar className="mx-auto h-10 w-10 text-mystic-gold/60" strokeWidth={1.5} aria-hidden="true" />
            <p className="mt-4 text-sm text-mystic-text-dim leading-relaxed">
              {loadError
                ? "Статьи временно недоступны. Загляните позже — я регулярно пополняю блог."
                : "Статьи готовятся — я пишу их специально для вас. Загляните совсем скоро!"}
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
          >
            {articles.map((post) => (
              <BlogCard key={post.id} post={post} onOpen={() => setOpenId(post.id)} />
            ))}
          </motion.div>
        )}
      </div>

      {/* Диалог чтения статьи */}
      <Dialog open={openId !== null} onOpenChange={(open) => !open && setOpenId(null)}>
        <DialogContent
          className="max-w-2xl max-h-[85dvh] overflow-y-auto glass-strong p-0"
          aria-describedby={full?.excerpt ?? undefined}
        >
          {isLoadingFull || !full ? (
            <div className="flex flex-col gap-4 p-8" aria-busy="true">
              <DialogTitle className="sr-only">Загрузка статьи…</DialogTitle>
              <Skeleton className="h-8 w-3/4 bg-mystic-purple/20" />
              <Skeleton className="h-4 w-1/3 bg-mystic-purple/20" />
              <Skeleton className="h-4 w-full bg-mystic-purple/20" />
              <Skeleton className="h-4 w-full bg-mystic-purple/20" />
              <Skeleton className="h-4 w-5/6 bg-mystic-purple/20" />
              <span className="sr-only">Загружаем статью…</span>
            </div>
          ) : (
            <article className="p-6 sm:p-8">
              <DialogHeader className="text-left space-y-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-mystic-gold/20 bg-transparent px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-mystic-gold">
                    <BookOpen className="h-3 w-3" aria-hidden="true" />
                    {full.category}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-mystic-text-dim">
                    <Clock className="h-3.5 w-3.5 text-mystic-gold/60" aria-hidden="true" />
                    <span className="lux-numeral text-gold-foil text-sm leading-none">{full.readMinutes}</span> мин чтения
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-mystic-text-dim">
                    <CalendarDays className="h-3.5 w-3.5 text-mystic-gold/60" aria-hidden="true" />
                    {formatDateRu(full.createdAt)}
                  </span>
                </div>
                <DialogTitle className="font-[family-name:var(--font-cormorant)] text-2xl sm:text-3xl font-medium text-gold-foil leading-snug">
                  {full.title}
                </DialogTitle>
                <DialogDescription className="sr-only">{full.excerpt}</DialogDescription>
              </DialogHeader>

              {full.hasCover && (
                <div className="mt-5 overflow-hidden rounded-xl border border-mystic-gold/15">
                  <img
                    src={`/api/articles/${full.id}/cover`}
                    alt={`Иллюстрация к статье «${full.title}»`}
                    className="w-full h-48 sm:h-60 object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="mt-4">
                <Markdown source={full.content} />
              </div>

              <div className="mt-6 flex items-center justify-between gap-4 border-t border-mystic-gold/10 pt-4">
                <p className="text-xs text-mystic-text-dim/70 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-mystic-gold/50" aria-hidden="true" />
                  Статья подготовлена при участии ИИ и проверена Анной
                </p>
                <Button
                  variant="ghost"
                  onClick={() => setOpenId(null)}
                  className="h-11 rounded-full border border-mystic-gold/20 px-6 text-[12px] uppercase tracking-[0.14em] text-mystic-gold hover:text-mystic-gold-light hover:bg-mystic-gold/10 hover:border-mystic-gold/40"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                  Закрыть
                </Button>
              </div>
            </article>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function BlogCard({ post, onOpen }: { post: ArticleListItem; onOpen: () => void }) {
  return (
    <motion.div variants={cardVariants}>
      <Card
        role="button"
        tabIndex={0}
        aria-label={`Читать статью: ${post.title}`}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        className="lux-card group relative cursor-pointer overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mystic-gold/50"
      >
        {/* Обложка или мистический плейсхолдер */}
        <div className="relative h-40 overflow-hidden">
          {post.hasCover ? (
            <img
              src={`/api/articles/${post.id}/cover`}
              alt={`Иллюстрация к статье «${post.title}»`}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-mystic-purple/25 via-transparent to-mystic-gold/10">
              <MoonStar className="h-12 w-12 text-mystic-gold/40 transition-transform duration-700 group-hover:scale-110" strokeWidth={1.5} aria-hidden="true" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-mystic-deep/80 via-transparent to-transparent" />
        </div>

        <CardContent className="relative z-10 flex flex-col gap-3 pt-5 pb-4 px-6">
          <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-mystic-gold/20 bg-transparent px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-mystic-gold">
            <BookOpen className="h-3 w-3" aria-hidden="true" />
            {post.category}
          </span>

          <h3 className="font-[family-name:var(--font-cormorant)] text-xl sm:text-2xl font-medium text-mystic-text leading-snug transition-colors duration-500 group-hover:text-mystic-gold-light">
            {post.title}
          </h3>

          <p className="text-sm leading-relaxed text-mystic-text-dim line-clamp-3">
            {post.excerpt}
          </p>
        </CardContent>

        <CardFooter className="relative z-10 flex items-center justify-between gap-3 px-6 pb-6 pt-0">
          <span className="inline-flex items-center gap-1.5 text-xs text-mystic-text-dim">
            <Clock className="h-3.5 w-3.5 text-mystic-gold/60" aria-hidden="true" />
            <span className="lux-numeral text-gold-foil text-sm leading-none">{post.readMinutes}</span> мин
          </span>

          <span
            aria-hidden="true"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.16em] text-mystic-gold transition-colors duration-300 group-hover:text-mystic-gold-light"
          >
            Читать
            <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
          </span>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
