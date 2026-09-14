import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Task 24: обложка статьи (бинарём из БД).
 * GET /api/articles/[id]/cover → image/*
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Task 28: только опубликованные — скрытую статью не отдаём даже картинкой
    const article = await db.article.findFirst({
      where: { id, published: true },
      select: { cover: true, coverMime: true },
    });
    if (!article?.cover) {
      return NextResponse.json({ error: "Обложка не найдена" }, { status: 404 });
    }
    const bytes = Buffer.from(article.cover, "base64");
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": article.coverMime || "image/png",
        "Cache-Control": "public, max-age=86400",
        "Content-Length": String(bytes.length),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Не удалось загрузить обложку" },
      { status: 500 }
    );
  }
}
