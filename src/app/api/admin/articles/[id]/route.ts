import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

/**
 * Task 24: управление статьёй.
 * PATCH /api/admin/articles/[id] { published: boolean } — публикация/скрытие
 * DELETE /api/admin/articles/[id] — удаление
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }
  const published = (body as { published?: unknown })?.published;
  if (typeof published !== "boolean") {
    return NextResponse.json(
      { error: "Ожидалось поле published: boolean" },
      { status: 400 }
    );
  }

  try {
    const updated = await db.article.update({
      where: { id },
      data: { published },
      select: { id: true, published: true },
    });
    return NextResponse.json({ article: updated });
  } catch (err) {
    // Task 28: P2025 (не найдена) ≠ упавший сервер — не маскируем 500 под 404
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Статья не найдена" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Не удалось обновить статью" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    await db.article.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Статья не найдена" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Не удалось удалить статью" },
      { status: 500 }
    );
  }
}
