'use client';

import { motion } from 'framer-motion';
import { MessageCircle, Plus, Minus } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: 'Как проходит консультация?',
    answer:
      'Всё происходит онлайн — в Telegram, Max, Zoom или по телефону, как вам удобнее. Консультация длится около 60 минут: сначала мы обсуждаем ваш запрос, затем я делаю разбор — расклад карт или работу с натальной картой — и отвечаю на ваши вопросы. После встречи вы получаете запись или подробный конспект, чтобы ничего не потерялось.',
  },
  {
    question: 'Нужно ли как-то готовиться?',
    answer:
      'Особой подготовки не нужно — приходите как есть. Достаточно спокойно сформулировать два-три вопроса, которые для вас действительно важны. Если записываетесь на астрологическую консультацию, по возможности уточните дату, время и место рождения — это сделает разбор заметно точнее.',
  },
  {
    question: 'Что если я не верю в астрологию?',
    answer:
      'И не нужно. Воспринимайте консультацию как пространство для саморефлексии: карты и планеты — это язык образов, который помогает посмотреть на ситуацию под новым углом. Многие скептики уходят с неожиданно точными наблюдениями. Не верьте на слово — проверяйте всё на собственном опыте.',
  },
  {
    question: 'Это конфиденциально?',
    answer:
      'Да, абсолютно. Всё, что вы рассказываете, остаётся между нами: я не публикую записи без вашего согласия и не передаю данные третьим лицам. Вы можете задавать любые вопросы — здесь нет осуждения и «неправильных» тем.',
  },
  {
    question: 'Сколько стоит консультация и как оплатить?',
    answer:
      'Актуальные цены — в разделе «Услуги» на сайте. Для бронирования времени нужна предоплата 100% — она подтверждает вашу запись. Удобный способ оплаты (переводом на карту или через Telegram) мы согласуем при записи.',
  },
  {
    question: 'Что если ответы не понравятся?',
    answer:
      'Карты не выносят приговоров — они показывают энергии и возможности, а выбор всегда остаётся за вами. Если же после консультации вы почувствуете, что не получили ответы на свои вопросы, — я верну деньги. Без условий и долгих обсуждений, как и обещано в разделе «Моя гарантия».',
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="relative py-24 sm:py-32 overflow-hidden" aria-label="Частые вопросы">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-mystic-purple/5 blur-[120px] rounded-full" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <p className="lux-eyebrow lux-eyebrow-lines">Вопросы</p>
          <h2 className="font-[family-name:var(--font-cormorant)] text-3xl sm:text-4xl md:text-5xl font-medium text-gold-foil text-balance mt-5 mb-6">
            Частые вопросы
          </h2>
          <div className="lux-divider max-w-[280px] sm:max-w-xs mx-auto" aria-hidden="true">
            <span />
          </div>
          <p className="text-mystic-text-dim text-base sm:text-lg max-w-xl mx-auto mt-6">
            Всё, что вы хотели спросить перед первой консультацией — но стеснялись
          </p>
        </motion.div>

        {/* Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          {/* Люкс = воздух: никаких боксов, только hairline-разделители */}
          <Accordion type="single" collapsible className="w-full border-t border-mystic-gold/10">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={item.question} value={`item-${i}`} className="border-mystic-gold/10">
                <AccordionTrigger className="py-5 sm:py-6 text-base sm:text-lg font-[family-name:var(--font-cormorant)] font-medium text-mystic-text hover:text-mystic-gold hover:no-underline [&>svg]:hidden [&[data-state=open]_.faq-icon-plus]:rotate-90 [&[data-state=open]_.faq-icon-plus]:opacity-0 [&[data-state=open]_.faq-icon-minus]:opacity-100 [&[data-state=open]_.faq-indicator]:border-mystic-gold/50">
                  <span>{item.question}</span>
                  <span
                    className="faq-indicator relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-mystic-gold/25"
                    aria-hidden="true"
                  >
                    <Plus className="faq-icon-plus absolute h-3 w-3 text-mystic-gold transition-all duration-500" />
                    <Minus className="faq-icon-minus absolute h-3 w-3 text-mystic-gold opacity-0 transition-all duration-500" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-mystic-text-dim text-sm sm:text-base leading-relaxed pb-6">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* CTA */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 text-center text-mystic-text-dim text-sm sm:text-base flex flex-wrap items-center justify-center gap-1.5"
        >
          <MessageCircle className="w-4 h-4 text-mystic-gold/70" />
          <span>Остались вопросы? Напишите мне в Telegram</span>
          <a
            href="https://t.me/luna_stars_astro"
            target="_blank"
            rel="noopener noreferrer"
            className="text-mystic-gold underline-offset-4 hover:underline hover:text-mystic-gold-light transition-colors"
          >
            @luna_stars_astro
          </a>
        </motion.p>
      </div>
    </section>
  );
}

