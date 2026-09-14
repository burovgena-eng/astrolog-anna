"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Trash2, Eye, EyeOff, RefreshCw, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

/**
 * Task 24: управление AI-блогом в админке.
 * Генерация статьи (текст + обложка, до ~2 минут), список, скрытие/публикация, удаление.
 */

interface AdminArticle {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readMinutes: number;
  published: boolean;
  createdAt: string;
  hasCover: boolean;
}

const TOPIC_PRESETS = [
  "Как начать знакомство с Таро: первая колода и первые расклады",
  "Ретроградный Меркурий: мифы и правда",
  "Синастрия: что говорит натальная карта об отношениях",
  "Руны для повседневных решений: простая практика",
  "Как составить личный лунный календарь на месяц",
  "5 мифов об астрологии, в которые пора перестать верить",
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export function BlogAdmin({
  token,
  onSessionExpired,
}: {
  token: string;
  onSessionExpired: () => void;
}) {
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [topic, setTopic] = useState<string>(TOPIC_PRESETS[0]);
  const [customTopic, setCustomTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadArticles = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      try {
        const res = await fetch("/api/admin/articles", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (res.status === 401) {
          onSessionExpired();
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { articles?: AdminArticle[] };
        setArticles(Array.isArray(data.articles) ? data.articles : []);
      } catch {
        toast.error("Не удалось загрузить статьи");
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [token, onSessionExpired]
  );

  useEffect(() => {
    void loadArticles();
  }, [loadArticles]);

  async function generate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isGenerating) return;
    const finalTopic = (customTopic.trim() || topic).trim();
    if (finalTopic.length < 3) {
      toast.error("Опишите тему статьи");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch("/api/admin/articles/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ topic: finalTopic }),
      });
      if (res.status === 401) {
        onSessionExpired();
        toast.error("Сессия истекла, войдите заново");
        return;
      }
      if (res.status === 429) {
        toast.error("Слишком много генераций подряд — подождите минуту");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as {
        article?: { title: string };
        withCover?: boolean;
      };
      toast.success(
        `Статья «${data.article?.title ?? ""}» опубликована${data.withCover ? " с обложкой" : " (без обложки)"}`,
        { description: "Она уже видна в блоге на главной странице" }
      );
      setCustomTopic("");
      await loadArticles(true);
    } catch {
      toast.error("Не удалось сгенерировать статью. Попробуйте ещё раз.", {
        description: "Генерация занимает время — возможно, сервис занят.",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function togglePublished(article: AdminArticle) {
    setBusyId(article.id);
    const prev = articles;
    setArticles((list) =>
      list.map((a) => (a.id === article.id ? { ...a, published: !a.published } : a))
    );
    try {
      const res = await fetch(`/api/admin/articles/${article.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ published: !article.published }),
      });
      if (res.status === 401) {
        onSessionExpired();
        toast.error("Сессия истекла, войдите заново");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      toast.success(article.published ? "Статья скрыта с сайта" : "Статья опубликована");
    } catch {
      setArticles(prev);
      toast.error("Не удалось изменить публикацию");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(article: AdminArticle) {
    if (!window.confirm(`Удалить статью «${article.title}»? Действие необратимо.`)) return;
    setBusyId(article.id);
    const prev = articles;
    setArticles((list) => list.filter((a) => a.id !== article.id));
    try {
      const res = await fetch(`/api/admin/articles/${article.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        onSessionExpired();
        toast.error("Сессия истекла, войдите заново");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      toast.success("Статья удалена");
    } catch {
      setArticles(prev);
      toast.error("Не удалось удалить статью");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* Генерация */}
      <form
        onSubmit={generate}
        className="rounded-2xl glass border-gold-shimmer p-4 sm:p-5"
        aria-busy={isGenerating}
      >
        <h2 className="flex items-center gap-2 font-[family-name:var(--font-cormorant)] text-lg font-semibold text-gold-gradient">
          <Sparkles className="h-4 w-4 text-mystic-gold" aria-hidden="true" />
          Новая статья с помощью ИИ
        </h2>
        <p className="mt-1 text-xs text-mystic-text-dim">
          Выберите готовую тему или опишите свою. Генерация текста и обложки занимает
          1–2 минуты — статья сразу появится в блоге на главной.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {TOPIC_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setTopic(preset)}
              aria-pressed={topic === preset && customTopic.trim() === ""}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                topic === preset && customTopic.trim() === ""
                  ? "border-mystic-gold/60 bg-mystic-gold/10 text-mystic-gold"
                  : "border-mystic-gold/15 text-mystic-text-dim hover:border-mystic-gold/40 hover:text-mystic-text"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Input
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            maxLength={200}
            placeholder="Своя тема: о чём написать статью?"
            aria-label="Своя тема статьи"
            className="border-mystic-purple/20 bg-mystic-surface/80 text-mystic-text placeholder:text-mystic-text-dim/50 focus:border-mystic-gold/60 focus:ring-mystic-gold/30"
          />
          <Button
            type="submit"
            disabled={isGenerating}
            className="shrink-0 bg-gold-gradient font-semibold text-mystic-deep hover:opacity-90 disabled:opacity-40"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Пишем статью… (1–2 мин)
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Сгенерировать
              </span>
            )}
          </Button>
        </div>
      </form>

      {/* Список */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-[family-name:var(--font-cormorant)] text-lg font-semibold text-gold-gradient">
          <FileText className="h-4 w-4 text-mystic-gold" aria-hidden="true" />
          Статьи ({articles.length})
        </h2>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Обновить список статей"
          onClick={() => void loadArticles()}
          className="text-mystic-text-dim hover:bg-mystic-gold/10 hover:text-mystic-gold"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-mystic-gold/10 bg-mystic-surface/40 px-6 py-12 text-center text-sm text-mystic-text-dim">
          Загружаем статьи…
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-2xl border border-mystic-gold/10 bg-mystic-surface/40 px-6 py-12 text-center text-sm text-mystic-text-dim">
          Статей пока нет. Сгенерируйте первую — она сразу появится в блоге.
        </div>
      ) : (
        <div className="flex max-h-[60dvh] flex-col gap-3 overflow-y-auto pr-1">
          {articles.map((a) => (
            <motion.article
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl glass border-gold-shimmer p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-[family-name:var(--font-cormorant)] text-base font-semibold text-mystic-text">
                      {a.title}
                    </h3>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                        a.published
                          ? "border-emerald-400/40 text-emerald-300"
                          : "border-mystic-gold/30 text-mystic-text-dim"
                      }`}
                    >
                      {a.published ? "Опубликовано" : "Скрыта"}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-mystic-text-dim">
                    {a.excerpt}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-mystic-text-dim/60">
                    {a.category} · {a.readMinutes} мин · {formatDate(a.createdAt)}
                    {a.hasCover ? " · есть обложка" : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={a.published ? `Скрыть «${a.title}»` : `Опубликовать «${a.title}»`}
                    title={a.published ? "Скрыть с сайта" : "Опубликовать"}
                    disabled={busyId === a.id}
                    onClick={() => void togglePublished(a)}
                    className="text-mystic-text-dim hover:bg-mystic-gold/10 hover:text-mystic-gold"
                  >
                    {a.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Удалить «${a.title}»`}
                    title="Удалить"
                    disabled={busyId === a.id}
                    onClick={() => void remove(a)}
                    className="text-mystic-text-dim hover:bg-red-400/10 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
