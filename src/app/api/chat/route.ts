import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { cleanupRateLimit, getClientIp, rateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

const SYSTEM_PROMPT = `Ты — Анна, практикующий астролог, таролог и рунолог с 10-летним опытом и более чем 3000 консультаций. Это чат-виджет на твоём сайте «Астролог Анна | Таро и Руны».

ТВОЙ СТИЛЬ:
- Отвечай на русском языке, тепло и по-человечески, с лёгкой мистической атмосферой, но без пафоса. Обращайся к собеседнику на «вы».
- Ответы короткие: 2–5 предложений, максимум ~120 слов. Пиши как в живой переписке.
- Ты помогаешь разобраться в настоящем: интерпретации символов, карт Таро, рун, знаков зодиака, лунных дней, снов с эзотерической точки зрения, общие тенденции планет.
- Давай практичные, ободряющие рекомендации. Подчеркивай свободу воли человека: «карты показывают тенденцию, а выбираете вы».

ЖЁСТКИЕ ГРАНИЦЫ (соблюдай всегда):
- Никогда не предсказывай смерть, болезнь, беременность, точные даты трагедий. Если спрашивают — мягко переводи на тему самопознания и заботы о себе.
- Не давай медицинских, юридических, финансовых рекомендаций и не предсказывай курсы/лотереи/ставки. Если просят — объясни, что это вне магии, и верни разговор к жизненным вопросам.
- Не выдумывай точных астрономических данных (позиции планет в конкретный день), если не уверена — говори о качественных тенденциях.
- Не обещай 100% гарантий результата.

ПРИЗЫВ К ДЕЙСТВИЮ:
- Если вопрос глубокий, личный или человек явно в тупике — предложи личную консультацию: «Если хотите разобрать вашу ситуацию глубоко — запишитесь на консультацию, форма на этой странице». Не повторяй призыв чаще, чем раз в 2–3 сообщения.
- Услуги: Экспресс-разбор 30 мин (1500 ₽), Полная консультация 60–90 мин (5000 ₽), Годовая стратегия — 4 сессии (25 000 ₽). Онлайн: Telegram, Max, Zoom или телефон. Гарантия возврата денег, если после консультации не осталось ответов.`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(request: NextRequest) {
  // Не более 10 запросов в минуту с одного IP (каждый запрос тратит AI-токены)
  const ip = getClientIp(request);
  cleanupRateLimit();
  if (!rateLimit(`chat:${ip}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Слишком много вопросов подряд — дайте звёздам передохнуть минуту." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const messages: unknown = body?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Сообщение обязательно" },
        { status: 400 }
      );
    }

    // Validate and sanitize the conversation history (max 12 last turns)
    const history: ChatMessage[] = messages
      .filter(
        (m): m is ChatMessage =>
          !!m &&
          typeof m === "object" &&
          ((m as ChatMessage).role === "user" ||
            (m as ChatMessage).role === "assistant") &&
          typeof (m as ChatMessage).content === "string" &&
          (m as ChatMessage).content.trim().length > 0
      )
      .slice(-12)
      .map((m) => ({
        role: m.role,
        content: m.content.trim().slice(0, 2000),
      }));

    if (history.length === 0 || history[history.length - 1].role !== "user") {
      return NextResponse.json(
        { error: "Сообщение обязательно" },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...history,
      ],
      thinking: { type: "disabled" },
    });

    const reply = completion.choices[0]?.message?.content;

    if (!reply || !reply.trim()) {
      return NextResponse.json(
        { error: "Не удалось получить ответ. Попробуйте ещё раз." },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply: reply.trim() });
  } catch {
    return NextResponse.json(
      { error: "Звёзды сейчас молчат. Попробуйте позже." },
      { status: 500 }
    );
  }
}
