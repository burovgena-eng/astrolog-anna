import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

/**
 * Task 24: полный список статей для админки (включая неопубликованные).
 * GET /api/admin/articles — без content/cover (лёгкий ответ).
 */
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const articles = await db.article.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        excerpt: true,
        category: true,
        readMinutes: true,
        published: true,
        createdAt: true,
        cover: true,
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
          published: a.published,
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
