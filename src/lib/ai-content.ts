/**
 * Task 24/25: серверные обёртки над z-ai-web-dev-sdk.
 * ТОЛЬКО backend (API-роуты) — SDK запрещено на клиенте.
 *
 *  - generateArticle(topic)  → статья блога (title/excerpt/content-markdown/category)
 *  - generateArticleCover()  → обложка статьи (base64 PNG)
 *  - generateHoroscope(...)  → персональный прогноз (текст по-русски)
 *
 * Все промпты выдают строгий JSON/текст без внешних ресурсов.
 */
import ZAI from "z-ai-web-dev-sdk";
import type { MoonInfo } from "./moon";

const ARTICLE_SYSTEM = `Ты — Анна, практикующий астролог, таролог и рунолог из Новосибирска с 10-летним опытом. Пишешь статьи для блога своего сайта: тёплым, но профессиональным тоном, без мистического запугивания и без медицинских/финансовых обещаний. Пишешь живо, с примерами, структурировано. Всегда отвечаешь ТОЛЬКО валидным JSON без markdown-обёртки.`;

const ARTICLE_SCHEMA_HINT = `Верни JSON строго вида:
{
  "title": "заголовок статьи на русском, до 70 символов, без кавычек внутри",
  "excerpt": "анонс 1-2 предложения, до 200 символов",
  "category": "одна из: Астрология | Таро | Руны | Лунный календарь | Практика",
  "content": "полный текст статьи в Markdown на русском: 5-8 разделов с '## ' подзаголовками, абзацы по 2-4 предложения, можно списки '- '. Объём 500-800 слов. В конце раздел '## Как записаться' с 1-2 предложениями и приглашением на консультацию."
}`;

export interface GeneratedArticle {
  title: string;
  excerpt: string;
  category: string;
  content: string;
  readMinutes: number;
}

/** Извлечь JSON-объект из ответа модели (терпит ```-обёртки и текст вокруг). */
function extractJson(raw: string): Record<string, unknown> {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("В ответе модели нет JSON");
  return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
}

function str(v: unknown, field: string): string {
  if (typeof v !== "string" || v.trim() === "") {
    throw new Error(`Модель не вернула поле «${field}»`);
  }
  return v.trim();
}

const VALID_CATEGORIES = new Set([
  "Астрология",
  "Таро",
  "Руны",
  "Лунный календарь",
  "Практика",
]);

/** Генерация статьи блога по теме (или произвольному запросу администратора). */
export async function generateArticle(topic: string): Promise<GeneratedArticle> {
  const zai = await ZAI.create();
  const completion = await zai.chat.completions.create({
    messages: [
      { role: "system", content: `${ARTICLE_SYSTEM}\n\n${ARTICLE_SCHEMA_HINT}` },
      {
        role: "user",
        content: `Напиши статью для блога на тему: «${topic}». Требования выше.`,
      },
    ],
    thinking: { type: "disabled" },
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  const obj = extractJson(raw);
  const title = str(obj.title, "title").slice(0, 120);
  const excerpt = str(obj.excerpt, "excerpt").slice(0, 300);
  const content = str(obj.content, "content");
  const categoryRaw = str(obj.category, "category");
  const category = VALID_CATEGORIES.has(categoryRaw) ? categoryRaw : "Практика";

  const words = content.split(/\s+/).filter(Boolean).length;
  const readMinutes = Math.max(2, Math.min(20, Math.round(words / 160) || 3));

  return { title, excerpt, category, content, readMinutes };
}

/** Обложка статьи: элегантная иллюстрация в стиле сайта. Возвращает base64 PNG. */
export async function generateArticleCover(topic: string): Promise<{
  base64: string;
  mime: string;
}> {
  const zai = await ZAI.create();
  const response = await zai.images.generations.create({
    prompt: `Elegant mystical illustration for a mystical blog article about "${topic}". Deep midnight navy and black palette with gold accents, crescent moon, stars, subtle tarot or rune symbols, luxurious art deco astrology aesthetic, dark background, no text, no words, high quality digital painting`,
    size: "1152x864",
  });
  const base64 = response.data[0]?.base64;
  if (!base64) throw new Error("Генератор обложек не вернул изображение");
  return { base64, mime: "image/png" };
}

/* ------------------------------ Гороскоп (#5) ------------------------------ */

export const HOROSCOPE_FOCUS = {
  love: "Любовь и отношения",
  career: "Карьера и финансы",
  self: "Самопознание и энергия",
} as const;

export type HoroscopeFocus = keyof typeof HOROSCOPE_FOCUS;

const HOROSCOPE_SYSTEM = `Ты — Анна, практикующий астролог и таролог из Новосибирска. Составляешь короткие персональные прогнозы для посетителей сайта. Тон: тёплый, поддерживающий, конкретный, без запугивания, без медицинских и финансовых обещаний, без гарантий. Пишешь по-русски, обращаясь к человеку на «вы» по имени (если имя указано). Структура ответа: 3 абзаца по 2-4 предложения, разделяемых пустой строкой, БЕЗ markdown-заголовков и списков. Допустимо выделить 1-2 ключевые фразы **жирным**. Не выдумывай фактов, которых нет в данных; опирайся только на переданные астрономические данные.`;

export interface HoroscopeInput {
  name: string | null;
  birthDate: string; // YYYY-MM-DD
  birthTime: string | null; // HH:mm | null
  focus: HoroscopeFocus;
  sunSignName: string;
  sunSignSymbol: string;
  moon: Pick<
    MoonInfo,
    "phaseName" | "illumination" | "lunarDay" | "waxing" | "zodiac"
  >;
}

/** Персональный прогноз: данные астрономии → тёплый текст от лица Анны. */
export async function generateHoroscopeText(input: HoroscopeInput): Promise<string> {
  const zai = await ZAI.create();
  const moonPct = Math.round(input.moon.illumination * 100);
  const focusLabel = HOROSCOPE_FOCUS[input.focus];

  const completion = await zai.chat.completions.create({
    messages: [
      { role: "system", content: HOROSCOPE_SYSTEM },
      {
        role: "user",
        content: [
          `Данные человека:`,
          `- Имя: ${input.name ?? "не указано"}`,
          `- Дата рождения: ${input.birthDate}${input.birthTime ? `, время: ${input.birthTime}` : ""}`,
          `- Солнечный знак: ${input.sunSignName} ${input.sunSignSymbol}`,
          `- Фокус запроса: ${focusLabel}`,
          `Сегодняшняя астрономия:`,
          `- Фаза Луны: ${input.moon.phaseName}, освещённость ${moonPct}%, лунный день ${input.moon.lunarDay}, Луна ${input.moon.waxing ? "растёт" : "убывает"}, Луна в знаке ${input.moon.zodiac.name}`,
          ``,
          `Составь персональный прогноз на ближайшие дни: 1-й абзац — о природе его солнечного знака в контексте фокуса запроса, 2-й — как сегодняшняя фаза Луны влияет на его состояние и что делать, 3-й — короткий практический совет и мягкое приглашение на полную консультацию.`,
        ].join("\n"),
      },
    ],
    thinking: { type: "disabled" },
  });

  const text = (completion.choices[0]?.message?.content ?? "").trim();
  if (text.length < 100) throw new Error("Модель вернула слишком короткий прогноз");
  return text.slice(0, 4000);
}
