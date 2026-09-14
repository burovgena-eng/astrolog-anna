"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  MoonStar,
  RefreshCw,
  LogOut,
  Trash2,
  Search,
  X,
  Download,
  NotebookPen,
  Copy,
  Inbox,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { BlogAdmin } from "./blog-admin";

interface Booking {
  id: string;
  name: string;
  contact: string;
  service: string;
  datetime: string;
  comment: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
}

type Filter = "all" | "new" | "confirmed" | "completed" | "cancelled";

const TOKEN_KEY = "admin_session_token";

const STATUS_LABELS: Record<string, string> = {
  new: "Новая",
  confirmed: "Подтверждена",
  completed: "Проведена",
  cancelled: "Отменена",
};

const STATUS_STYLES: Record<string, string> = {
  new: "border-mystic-gold/40 text-mystic-gold",
  confirmed: "border-emerald-400/40 text-emerald-300",
  completed: "border-mystic-purple/50 text-mystic-text",
  cancelled: "border-red-400/30 text-red-300/80",
};

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "new", label: "Новые" },
  { key: "confirmed", label: "Подтверждённые" },
  { key: "completed", label: "Проведённые" },
  { key: "cancelled", label: "Отменённые" },
];

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null; // localStorage может быть недоступен (iframe)
  }
}

function storeToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* куке остаётся резервным каналом */
  }
}

function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* noop */
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Желаемая дата заявки: слоты уже человекочитаемые, старые ISO-строки приводим к «ДД.ММ.ГГ, ЧЧ:ММ». */
function prettyDesired(dt: string): string {
  if (/^\d{4}-\d{2}-\d{2}T/.test(dt)) return formatDate(dt);
  return dt;
}

/** Контакт → ссылка (телефон/e-mail), если похоже на формат. */
function contactLink(contact: string): { href: string; kind: "tel" | "mail" } | null {
  const c = contact.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c)) {
    return { href: `mailto:${c}`, kind: "mail" };
  }
  const digits = c.replace(/\D/g, "");
  if (/^\+?[\d\s\-()]{6,20}$/.test(c) && digits.length >= 6) {
    return { href: `tel:${c.replace(/[\s\-()]/g, "")}`, kind: "tel" };
  }
  return null;
}

/** Копирование с фолбэком (clipboard API недоступен вне secure context). */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [notesOpenId, setNotesOpenId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [view, setView] = useState<"bookings" | "blog">("bookings");
  const tokenRef = useRef<string | null>(null);

  const logout = useCallback((silent: boolean) => {
    clearStoredToken();
    tokenRef.current = null;
    setToken(null);
    setBookings([]);
    if (!silent) {
      void fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
      toast.info("Вы вышли из панели");
    }
  }, []);

  const loadBookings = useCallback(
    async (activeToken: string, silent = false) => {
      if (!silent) setIsRefreshing(true);
      try {
        const res = await fetch("/api/admin/bookings", {
          headers: { Authorization: `Bearer ${activeToken}` },
          cache: "no-store",
        });
        if (res.status === 401) {
          // Токен протух/невалиден — возвращаемся на экран входа
          logout(true);
          if (!silent) toast.error("Сессия истекла, войдите заново");
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { bookings?: Booking[] };
        setBookings(Array.isArray(data.bookings) ? data.bookings : []);
      } catch {
        if (!silent) toast.error("Не удалось загрузить заявки. Попробуйте ещё раз.");
      } finally {
        if (!silent) setIsRefreshing(false);
      }
    },
    [logout]
  );

  // Восстановление сессии при загрузке
  useEffect(() => {
    const stored = readStoredToken();
    tokenRef.current = stored;
    setToken(stored);
    setBootstrapped(true);
    if (stored) void loadBookings(stored, true);
  }, [loadBookings]);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!password.trim() || isLoggingIn) return;
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.token) {
        setLoginError(data.error || "Не удалось войти. Попробуйте ещё раз.");
        return;
      }
      storeToken(data.token as string);
      tokenRef.current = data.token as string;
      setToken(data.token as string);
      setPassword("");
      await loadBookings(data.token as string);
      toast.success("Добро пожаловать!");
    } catch {
      setLoginError("Сеть недоступна. Проверьте соединение и попробуйте снова.");
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function changeStatus(id: string, status: string) {
    const activeToken = tokenRef.current;
    if (!activeToken) return;
    const prev = bookings;
    setBookings((list) => list.map((b) => (b.id === id ? { ...b, status } : b)));
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.status === 401) {
        logout(true);
        toast.error("Сессия истекла, войдите заново");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      toast.success(`Статус: ${STATUS_LABELS[status] ?? status}`);
    } catch {
      setBookings(prev); // откат при ошибке
      toast.error("Не удалось изменить статус");
    }
  }

  function openNotes(b: Booking) {
    setNotesOpenId((current) => (current === b.id ? null : b.id));
    setNotesDraft(b.notes ?? "");
  }

  async function saveNotes(id: string) {
    const activeToken = tokenRef.current;
    if (!activeToken || isSavingNotes) return;
    setIsSavingNotes(true);
    const prev = bookings;
    const saved = notesDraft.trim();
    setBookings((list) =>
      list.map((b) => (b.id === id ? { ...b, notes: saved === "" ? null : saved } : b))
    );
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({ notes: notesDraft }),
      });
      if (res.status === 401) {
        logout(true);
        toast.error("Сессия истекла, войдите заново");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      setNotesOpenId(null);
      toast.success(saved === "" ? "Заметка удалена" : "Заметка сохранена");
    } catch {
      setBookings(prev); // откат при ошибке
      toast.error("Не удалось сохранить заметку");
    } finally {
      setIsSavingNotes(false);
    }
  }

  async function exportCsv() {
    const activeToken = tokenRef.current;
    if (!activeToken || isExporting) return;
    setIsExporting(true);
    try {
      const qs = filter !== "all" ? `?status=${filter}` : "";
      const res = await fetch(`/api/admin/bookings/export${qs}`, {
        headers: { Authorization: `Bearer ${activeToken}` },
        cache: "no-store",
      });
      if (res.status === 401) {
        logout(true);
        toast.error("Сессия истекла, войдите заново");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateStamp = new Date().toISOString().slice(0, 10);
      a.download = `zayavki${filter !== "all" ? `-${filter}` : ""}-${dateStamp}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(
        filter === "all" ? "CSV со всеми заявками скачан" : `CSV отфильтрован: ${STATUS_LABELS[filter]}`
      );
    } catch {
      toast.error("Не удалось выгрузить CSV");
    } finally {
      setIsExporting(false);
    }
  }

  async function deleteBooking(booking: Booking) {
    const activeToken = tokenRef.current;
    if (!activeToken) return;
    if (!window.confirm(`Удалить заявку от «${booking.name}»? Действие необратимо.`)) {
      return;
    }
    const prev = bookings;
    setBookings((list) => list.filter((b) => b.id !== booking.id));
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      if (res.status === 401) {
        logout(true);
        toast.error("Сессия истекла, войдите заново");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      toast.success("Заявка удалена");
    } catch {
      setBookings(prev); // откат при ошибке
      toast.error("Не удалось удалить заявку");
    }
  }

  /* ---------- Экран входа ---------- */
  if (!bootstrapped) return null;

  if (!token) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm rounded-2xl glass-strong border-gold-shimmer p-8"
        >
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-mystic-gold/40 bg-glow-gold">
              <MoonStar className="h-6 w-6 text-mystic-gold" />
            </div>
            <h1 className="font-[family-name:var(--font-cormorant)] text-2xl font-bold text-gold-gradient">
              Панель администратора
            </h1>
            <p className="text-xs text-mystic-text-dim">
              Введите пароль из файла .env (ADMIN_PASSWORD)
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="admin-password" className="text-sm text-mystic-text">
                Пароль
              </label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
                autoComplete="current-password"
                className="border-mystic-purple/30 bg-mystic-surface/80 text-mystic-text focus:border-mystic-gold/60 focus:ring-mystic-gold/30"
              />
              {loginError && (
                <p role="alert" className="text-xs text-red-300">
                  {loginError}
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={isLoggingIn || !password.trim()}
              className="bg-gold-gradient font-semibold text-mystic-deep hover:opacity-90 disabled:opacity-40"
            >
              {isLoggingIn ? "Входим…" : "Войти"}
            </Button>
          </form>

          <a
            href="/"
            className="mt-6 flex items-center justify-center gap-1.5 text-xs text-mystic-text-dim transition-colors hover:text-mystic-gold"
          >
            ← Вернуться на сайт
          </a>
        </motion.div>
      </main>
    );
  }

  /* ---------- Панель заявок ---------- */
  const counts: Record<Filter, number> = {
    all: bookings.length,
    new: bookings.filter((b) => b.status === "new").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  const q = query.trim().toLowerCase();
  const visible = bookings
    .filter((b) => filter === "all" || b.status === filter)
    .filter(
      (b) =>
        q === "" ||
        b.name.toLowerCase().includes(q) ||
        b.contact.toLowerCase().includes(q) ||
        b.service.toLowerCase().includes(q) ||
        (b.comment ?? "").toLowerCase().includes(q) ||
        (b.notes ?? "").toLowerCase().includes(q)
    );

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-mystic-gold/40 bg-glow-gold">
            <MoonStar className="h-5 w-5 text-mystic-gold" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-cormorant)] text-2xl font-bold text-gold-gradient leading-tight">
              Заявки
            </h1>
            <p className="text-xs text-mystic-text-dim">
              Всего: {bookings.length} · Новых: {counts.new}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Обновить список"
            title="Обновить"
            onClick={() => {
              const activeToken = tokenRef.current;
              if (activeToken) void loadBookings(activeToken);
            }}
            disabled={isRefreshing}
            className="text-mystic-text-dim hover:bg-mystic-gold/10 hover:text-mystic-gold"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            aria-label="Скачать CSV"
            title="Скачать CSV (с учётом фильтра статусов)"
            onClick={() => void exportCsv()}
            disabled={isExporting || bookings.length === 0}
            className="text-mystic-text-dim hover:bg-mystic-gold/10 hover:text-mystic-gold"
          >
            <Download className={`h-4 w-4 ${isExporting ? "animate-bounce" : ""}`} />
            CSV
          </Button>
          <Button
            variant="ghost"
            onClick={() => logout(false)}
            className="text-mystic-text-dim hover:bg-mystic-gold/10 hover:text-mystic-gold"
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </Button>
        </div>
      </div>

      {/* Вкладки: Заявки / Блог */}
      <div className="mt-5 flex gap-2" role="tablist" aria-label="Разделы панели">
        <button
          role="tab"
          aria-selected={view === "bookings"}
          onClick={() => setView("bookings")}
          className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm transition-colors ${
            view === "bookings"
              ? "border-mystic-gold/60 bg-mystic-gold/10 text-mystic-gold"
              : "border-mystic-gold/15 text-mystic-text-dim hover:border-mystic-gold/40 hover:text-mystic-text"
          }`}
        >
          <Inbox className="h-3.5 w-3.5" aria-hidden="true" />
          Заявки
        </button>
        <button
          role="tab"
          aria-selected={view === "blog"}
          onClick={() => setView("blog")}
          className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm transition-colors ${
            view === "blog"
              ? "border-mystic-gold/60 bg-mystic-gold/10 text-mystic-gold"
              : "border-mystic-gold/15 text-mystic-text-dim hover:border-mystic-gold/40 hover:text-mystic-text"
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
          Блог
        </button>
      </div>

      {view === "blog" ? (
        <BlogAdmin token={token} onSessionExpired={() => logout(true)} />
      ) : (
        <>
      {/* Search */}
      <div className="relative mt-6">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mystic-text-dim/60"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск: имя, контакт, услуга, комментарий, заметка…"
          aria-label="Поиск по заявкам"
          className="border-mystic-purple/20 bg-mystic-surface/80 pl-9 pr-9 text-mystic-text placeholder:text-mystic-text-dim/50 focus:border-mystic-gold/60 focus:ring-mystic-gold/30 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            aria-label="Очистить поиск"
            onClick={() => setQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-mystic-text-dim/60 transition-colors hover:bg-mystic-gold/10 hover:text-mystic-gold"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Фильтр по статусам">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
              filter === f.key
                ? "border-mystic-gold/60 bg-mystic-gold/10 text-mystic-gold"
                : "border-mystic-gold/15 text-mystic-text-dim hover:border-mystic-gold/40 hover:text-mystic-text"
            }`}
          >
            {f.label} {counts[f.key]}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mt-6 flex max-h-[70dvh] flex-col gap-3 overflow-y-auto pr-1">
        {visible.length === 0 ? (
          <div className="rounded-2xl border border-mystic-gold/10 bg-mystic-surface/40 px-6 py-16 text-center text-sm text-mystic-text-dim">
            {bookings.length === 0
              ? "Заявок пока нет — как только кто-то запишется, заявка появится здесь."
              : q !== ""
                ? `Ничего не найдено по запросу «${query.trim()}».`
                : "В этой категории заявок нет."}
          </div>
        ) : (
          visible.map((b) => {
            const link = contactLink(b.contact);
            return (
              <article
                key={b.id}
                className="rounded-2xl glass border-gold-shimmer p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-[family-name:var(--font-cormorant)] text-lg font-semibold text-mystic-text">
                        {b.name}
                      </h2>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                          STATUS_STYLES[b.status] ?? STATUS_STYLES.new
                        }`}
                      >
                        {STATUS_LABELS[b.status] ?? b.status}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {link ? (
                        <a
                          href={link.href}
                          className="break-all text-sm text-mystic-gold/90 underline decoration-mystic-gold/30 underline-offset-2 transition-colors hover:text-mystic-gold hover:decoration-mystic-gold/70"
                        >
                          {b.contact}
                        </a>
                      ) : (
                        <p className="break-all text-sm text-mystic-gold/90">{b.contact}</p>
                      )}
                      <button
                        type="button"
                        aria-label={`Скопировать контакт ${b.name}`}
                        title="Скопировать контакт"
                        onClick={async () => {
                          const ok = await copyText(b.contact);
                          if (ok) toast.success("Контакт скопирован");
                          else toast.error("Не удалось скопировать");
                        }}
                        className="rounded-md p-1 text-mystic-text-dim/50 transition-colors hover:bg-mystic-gold/10 hover:text-mystic-gold"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-mystic-text-dim">
                      {b.service}
                      {b.datetime ? ` · ${prettyDesired(b.datetime)}` : ""}
                    </p>
                    {b.comment && (
                      <p className="mt-2 rounded-lg border border-mystic-purple/20 bg-mystic-surface/60 p-2.5 text-xs text-mystic-text-dim">
                        {b.comment}
                      </p>
                    )}

                    {/* Заметки CRM */}
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => openNotes(b)}
                        aria-expanded={notesOpenId === b.id}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                          b.notes
                            ? "border-mystic-gold/40 bg-mystic-gold/10 text-mystic-gold"
                            : "border-mystic-gold/15 text-mystic-text-dim hover:border-mystic-gold/40 hover:text-mystic-text"
                        }`}
                      >
                        <NotebookPen className="h-3 w-3" />
                        {b.notes ? "Заметка" : "Добавить заметку"}
                      </button>

                      {notesOpenId === b.id && (
                        <div className="mt-2 flex flex-col gap-2">
                          <Textarea
                            value={notesDraft}
                            onChange={(e) => setNotesDraft(e.target.value)}
                            maxLength={2000}
                            rows={3}
                            placeholder="Личный CRM-комментарий: договорённости, пожелания, итоги консультации…"
                            aria-label={`Заметка к заявке от ${b.name}`}
                            className="border-mystic-gold/20 bg-mystic-surface/80 text-xs text-mystic-text placeholder:text-mystic-text-dim/40 focus:border-mystic-gold/60 focus:ring-mystic-gold/30"
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-mystic-text-dim/50">
                              {notesDraft.length}/2000 · видна только вам, попадёт в CSV
                            </span>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setNotesOpenId(null)}
                                className="h-7 px-2.5 text-xs text-mystic-text-dim hover:text-mystic-text"
                              >
                                Отмена
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => void saveNotes(b.id)}
                                disabled={isSavingNotes}
                                className="h-7 bg-gold-gradient px-3 text-xs font-semibold text-mystic-deep hover:opacity-90"
                              >
                                {isSavingNotes ? "Сохраняем…" : "Сохранить"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {b.notes && notesOpenId !== b.id && (
                        <p className="mt-2 rounded-lg border border-mystic-gold/15 bg-mystic-gold/5 p-2.5 text-xs whitespace-pre-wrap text-mystic-text/80">
                          {b.notes}
                        </p>
                      )}
                    </div>

                    <p className="mt-2 text-[10px] uppercase tracking-wider text-mystic-text-dim/60">
                      Создана: {formatDate(b.createdAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <select
                      aria-label={`Статус заявки от ${b.name}`}
                      value={b.status}
                      onChange={(e) => void changeStatus(b.id, e.target.value)}
                      className="rounded-lg border border-mystic-gold/20 bg-mystic-surface px-2.5 py-1.5 text-xs text-mystic-text outline-none transition-colors focus:border-mystic-gold/60"
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value} className="bg-mystic-deep">
                          {label}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Удалить заявку от ${b.name}`}
                      title="Удалить"
                      onClick={() => void deleteBooking(b)}
                      className="text-mystic-text-dim hover:bg-red-400/10 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
        </>
      )}
    </main>
  );
}
