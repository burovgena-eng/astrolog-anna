import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Task 24: полная опубликованная статья по id (content без байтов cover).
 * GET /api/articles/[id]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const article = await db.article.findFirst({
      where: { id, published: true },
      select: {
        id: true,
        title: true,
        excerpt: true,
        content: true,
        category: true,
        readMinutes: true,
        createdAt: true,
        cover: true,
      },
    });
    if (!article) {
      return NextResponse.json({ error: "Статья не найдена" }, { status: 404 });
    }
    return NextResponse.json(
      {
        article: {
          id: article.id,
          title: article.title,
          excerpt: article.excerpt,
          content: article.content,
          category: article.category,
          readMinutes: article.readMinutes,
          createdAt: article.createdAt,
          hasCover: Boolean(article.cover),
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { error: "Не удалось загрузить статью" },
      { status: 500 }
    );
  }
}
