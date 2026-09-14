import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const ALLOWED_STATUSES = ["new", "confirmed", "completed", "cancelled"] as const;

const STATUS_LABELS: Record<string, string> = {
  new: "Новая",
  confirmed: "Подтверждена",
  completed: "Проведена",
  cancelled: "Отменена",
};

/** Значение ячейки CSV: всё в кавычках (Excel/LibreOffice читает как текст —
 *  это же защита от формульных инъекций вида «+7…» / «=СУММ…»). */
function csvCell(value: string | null | undefined): string {
  return `"${(value ?? "").replace(/"/g, '""')}"`;
}

/** Дата в формате, который Excel RU понимает без настроек: дд.мм.гггг чч:мм (по Новосибирску). */
function csvDate(iso: Date): string {
  const nsk = new Date(iso.getTime() + 7 * 60 * 60_000); // UTC+7, без DST
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(nsk.getUTCDate())}.${pad(nsk.getUTCMonth() + 1)}.${nsk.getUTCFullYear()} ${pad(nsk.getUTCHours())}:${pad(nsk.getUTCMinutes())}`;
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Экспорт отдаёт все заявки разом — ограничиваем частоту
  if (!rateLimit(`export:${getClientIp(request)}`, 20, 60_000)) {
    return NextResponse.json(
      { error: "Слишком часто. Подождите минуту." },
      { status: 429 }
    );
  }

  // Необязательный фильтр по статусу: /export?status=new
  const statusParam = request.nextUrl.searchParams.get("status") ?? "";
  const status =
    statusParam && (ALLOWED_STATUSES as readonly string[]).includes(statusParam)
      ? statusParam
      : null;

  try {
    const bookings = await db.booking.findMany({
      ...(status ? { where: { status } } : {}),
      orderBy: { createdAt: "desc" },
    });

    const header = [
      "Дата заявки",
      "Клиент",
      "Контакт",
      "Услуга",
      "Желаемая дата",
      "Комментарий клиента",
      "Статус",
      "Заметки",
    ];

    const rows = bookings.map((b) =>
      [
        csvDate(b.createdAt),
        b.name,
        b.contact,
        b.service,
        b.datetime,
        b.comment,
        STATUS_LABELS[b.status] ?? b.status,
        b.notes,
      ]
        .map(csvCell)
        .join(";")
    );

    // BOM — чтобы Excel без настроек открыл UTF-8 кириллицу
    const csv = "\uFEFF" + [header.map(csvCell).join(";"), ...rows].join("\r\n");

    const dateStamp = new Date().toISOString().slice(0, 10);
    const suffix = status ? `-${status}` : "";
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="zayavki${suffix}-${dateStamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Не удалось сформировать экспорт" },
      { status: 500 }
    );
  }
}
