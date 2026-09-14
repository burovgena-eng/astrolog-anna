import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

const ALLOWED_STATUSES = ["new", "confirmed", "completed", "cancelled"] as const;
const MAX_NOTES = 2000;

function isNotFound(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025"
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const hasStatus = typeof body?.status === "string";
    const hasNotes =
      typeof body?.notes === "string" || body?.notes === null;

    if (!hasStatus && !hasNotes) {
      return NextResponse.json(
        { error: "Нечего обновлять: передайте status и/или notes" },
        { status: 400 }
      );
    }

    const data: { status?: string; notes?: string | null } = {};

    if (hasStatus) {
      if (!(ALLOWED_STATUSES as readonly string[]).includes(body.status)) {
        return NextResponse.json({ error: "Недопустимый статус" }, { status: 400 });
      }
      data.status = body.status;
    }

    if (hasNotes) {
      if (body.notes === null || body.notes.trim() === "") {
        data.notes = null; // пустая строка = заметка удалена
      } else {
        const notes = body.notes.trim();
        if (notes.length > MAX_NOTES) {
          return NextResponse.json(
            { error: `Заметка слишком длинная (максимум ${MAX_NOTES} символов)` },
            { status: 400 }
          );
        }
        data.notes = notes;
      }
    }

    const booking = await db.booking.update({ where: { id }, data });
    return NextResponse.json({ success: true, booking });
  } catch (error) {
    if (isNotFound(error)) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Не удалось обновить заявку" },
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

  try {
    const { id } = await params;
    await db.booking.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (isNotFound(error)) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Не удалось удалить заявку" },
      { status: 500 }
    );
  }
}
