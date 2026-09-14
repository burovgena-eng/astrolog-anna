import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Task 24: публичный список опубликованных статей блога.
 * GET /api/articles?limit=3 — без content/cover (лёгкий ответ).
 */
export async function GET(request: NextRequest) {
  const limitRaw = request.nextUrl.searchParams.get("limit");
  const limit = Math.min(Math.max(Number(limitRaw) || 3, 1), 12);

  try {
    const articles = await db.article.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        excerpt: true,
        category: true,
        readMinutes: true,
        createdAt: true,
        cover: true, // отдаём только флаг hasCover; сами байты — в /cover
      },
    });

    return NextResponse.json(
      {
        articles: articles.map((a) => ({
          id: a.id,
          title: a.title,
          excerpt: a.excerpt,
          category: a.category,
          readMinutes: a.readMinutes,
          createdAt: a.createdAt,
          hasCover: Boolean(a.cover),
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { error: "Не удалось загрузить статьи" },
      { status: 500 }
    );
  }
}
