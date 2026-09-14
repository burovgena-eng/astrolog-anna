import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateArticle, generateArticleCover } from "@/lib/ai-content";

/**
 * Task 24: AI-генерация статьи блога (текст + обложка).
 * POST /api/admin/articles/generate { topic: string }
 *
 * Генерация небыстрая (текст ~10-30 c + обложка ~20-60 c), поэтому:
 *  - rate limit 5/мин с IP;
 *  - обложка генерируется с гонкой по таймауту: если не успела — статья
 *    сохраняется без обложки (publish не блокируем).
 */
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!rateLimit(`articles-gen:${getClientIp(request)}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "Слишком много генераций подряд. Подождите минуту." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }
  const topic =
    typeof (body as { topic?: unknown })?.topic === "string"
      ? (body as { topic: string }).topic.trim()
      : "";
  if (topic.length < 3 || topic.length > 200) {
    return NextResponse.json(
      { error: "Укажите тему статьи (3–200 символов)" },
      { status: 400 }
    );
  }

  try {
    const article = await generateArticle(topic);

    // Обложка: параллельно, но не дольше 120 c — иначе без обложки.
    const coverPromise = generateArticleCover(topic);
    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 120_000)
    );
    let cover: { base64: string; mime: string } | null = null;
    try {
      cover = await Promise.race([coverPromise, timeout]);
    } catch {
      cover = null; // обложка не критична
    }

    const saved = await db.article.create({
      data: {
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        category: article.category,
        readMinutes: article.readMinutes,
        cover: cover?.base64 ?? null,
        coverMime: cover?.mime ?? null,
        published: true,
      },
      select: { id: true, title: true, category: true },
    });

    return NextResponse.json({
      article: saved,
      withCover: Boolean(cover),
    });
  } catch (err) {
    console.error("[articles/generate]", err);
    return NextResponse.json(
      { error: "Не удалось сгенерировать статью. Попробуйте ещё раз." },
      { status: 502 }
    );
  }
}
