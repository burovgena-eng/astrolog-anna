import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/mystical/footer";

// Шаблон layout сам добавит «| Астролог Анна» — без дубля
export const metadata: Metadata = {
  title: "Публичная оферта",
  description: "Публичная оферта на оказание консультационных услуг.",
};

export default function OfertaPage() {
  return (
    <div className="min-h-screen flex flex-col bg-mystic-deep text-mystic-text">
      <div className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24 w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-mystic-gold hover:text-mystic-gold-light transition-colors mb-8"
        >
          ← Назад на главную
        </Link>

        <h1 className="font-[family-name:var(--font-cormorant)] text-3xl sm:text-4xl font-bold text-gold-gradient mb-8">
          Публичная оферта
        </h1>

        <div className="space-y-6 text-mystic-text/85 leading-relaxed text-sm sm:text-base">
          <p className="text-mystic-text-dim text-xs">
            Дата публикации: 01.01.2025
          </p>

          <section>
            <h2 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-mystic-text mb-3">
              1. Термины и определения
            </h2>
            <p>
              Исполнитель — Анна, оказывающая услуги в сфере астрологии, таро и рун.
              Заказчик — физическое лицо, обратившееся за получением консультационных услуг.
              Услуги — консультации по астрологии, расклады Таро, гадание на рунах, составление натальной карты и астропрогнозов.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-mystic-text mb-3">
              2. Предмет оферты
            </h2>
            <p>
              Исполнитель предлагает Заказчику консультационные услуги в формате онлайн-консультаций
              (через Telegram, Max, Zoom или по телефону). Полный перечень услуг, их стоимость и
              описание представлены на сайте в разделе «Услуги».
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-mystic-text mb-3">
              3. Порядок заключения договора
            </h2>
            <p>
              Акцептом настоящей оферты является отправка заявки через форму на сайте или
              обращение через указанные контактные данные. Договор считается заключённым с
              момента подтверждения Заказчику даты и времени консультации.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-mystic-text mb-3">
              4. Оплата
            </h2>
            <p>
              Оплата услуг производится в размере 100% предоплаты до начала консультации.
              Оплата осуществляется переводом на карту, указанную Исполнителем. Подтверждение
              оплаты является условием начала оказания услуг.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-mystic-text mb-3">
              5. Обязанности Исполнителя
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Оказать услуги в полном объёме в согласованное время.</li>
              <li>Соблюдать конфиденциальность персональных данных Заказчика.</li>
              <li>Предоставить результат (разбор, рекомендации, план действий) в ходе консультации.</li>
              <li>Для пакета «Годовая стратегия» — предоставить письменный астропрогноз в согласованные сроки.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-mystic-text mb-3">
              6. Обязанности Заказчика
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Своевременно предоставить необходимые данные (дата, время и место рождения).</li>
              <li>Присутствовать на консультации в согласованное время.</li>
              <li>Оплатить услуги до начала консультации.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-mystic-text mb-3">
              7. Перенос и отмена консультации
            </h2>
            <p>
              Заказчик вправе перенести консультацию не позднее чем за 12 часов до начала.
              В случае отмены менее чем за 12 часов или неявки без предупреждения —
              консультация считается состоявшейся, оплата не возвращается.
              Исполнитель вправе перенести консультацию, уведомив Заказчика не менее чем за 2 часа.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-mystic-text mb-3">
              8. Гарантия возврата средств
            </h2>
            <p>
              Если после консультации Заказчик чувствует, что не получил ответы на свои вопросы,
              Исполнитель возвращает полную стоимость консультации в течение 24 часов с момента
              обращения. Заявка на возврат направляется через контактные данные Исполнителя.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-mystic-text mb-3">
              9. Конфиденциальность
            </h2>
            <p>
              Исполнитель обязуется не разглашать персональные данные Заказчика и содержание
              консультации третьим лицам без письменного согласия Заказчика, за исключением
              случаев, предусмотренных законодательством РФ.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-mystic-text mb-3">
              10. Ограничение ответственности
            </h2>
            <p>
              Консультации носят рекомендательный характер и не являются заменой
              профессиональной медицинской, юридической или финансовой помощи. Исполнитель не
              несёт ответственности за решения, принятые Заказчиком на основе консультации.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-mystic-text mb-3">
              11. Прочие условия
            </h2>
            <p>
              Настоящая оферта действует с момента публикации на сайте и до её отзыва.
              Исполнитель оставляет за собой право вносить изменения в текст оферты,
              уведомляя об этом через сайт. Актуальная версия всегда доступна по адресу /oferta.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-mystic-text mb-3">
              12. Реквизиты Исполнителя
            </h2>
            <p>
              Анна<br />
              E-mail: anna@luna-stars.ru<br />
              Telegram: @luna_stars_astro<br />
              Город: Новосибирск
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-mystic-gold/10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-mystic-gold hover:text-mystic-gold-light transition-colors"
          >
            ← Назад на главную
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
