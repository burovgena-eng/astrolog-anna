"use client";

import { Fragment, type ReactNode } from "react";

/**
 * Task 24: минимальный безопасный Markdown-рендер для AI-статей.
 * Никакого dangerouslySetInnerHTML: всё собирается React-узлами,
 * поэтому **отсутствует** вектор XSS из контента модели.
 *
 * Поддержка: '## '/'### ' заголовки, абзацы, списки '- ' и '1. ',
 * **жирный**, *курсив*.
 */

type Segment = { text: string; bold: boolean; italic: boolean };

/** Разбор строки с **жирным** и *курсивом* на сегменты. */
function parseInline(line: string): Segment[] {
  const segments: Segment[] = [];
  // жадно: **bold** имеет приоритет над *italic*
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(line)) !== null) {
    if (match.index > last) {
      segments.push({ text: line.slice(last, match.index), bold: false, italic: false });
    }
    const token = match[0];
    if (token.startsWith("**")) {
      segments.push({ text: token.slice(2, -2), bold: true, italic: false });
    } else {
      segments.push({ text: token.slice(1, -1), bold: false, italic: true });
    }
    last = match.index + token.length;
  }
  if (last < line.length) {
    segments.push({ text: line.slice(last), bold: false, italic: false });
  }
  return segments;
}

function renderInline(line: string, keyPrefix: string): ReactNode[] {
  return parseInline(line).map((seg, i) => {
    if (seg.bold) {
      return (
        <strong key={`${keyPrefix}-b${i}`} className="text-mystic-gold font-semibold">
          {seg.text}
        </strong>
      );
    }
    if (seg.italic) {
      return <em key={`${keyPrefix}-i${i}`}>{seg.text}</em>;
    }
    return <Fragment key={`${keyPrefix}-t${i}`}>{seg.text}</Fragment>;
  });
}

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];

  let list: { ordered: boolean; items: string[] } | null = null;

  const flushList = (key: string) => {
    if (!list) return;
    const { ordered, items } = list;
    const ItemTag = ordered ? "ol" : "ul";
    blocks.push(
      <ItemTag
        key={key}
        className={`my-3 space-y-1.5 pl-5 text-mystic-text-dim ${ordered ? "list-decimal" : "list-disc"} marker:text-mystic-gold/70`}
      >
        {items.map((item, i) => (
          <li key={`${key}-li${i}`} className="leading-relaxed">
            {renderInline(item, `${key}-li${i}`)}
          </li>
        ))}
      </ItemTag>
    );
    list = null;
  };

  let para: string[] = [];
  const flushPara = (key: string) => {
    if (para.length === 0) return;
    const text = para.join(" ");
    blocks.push(
      <p key={key} className="my-3 leading-relaxed text-mystic-text-dim">
        {renderInline(text, key)}
      </p>
    );
    para = [];
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trimEnd();
    const key = `md-${idx}`;

    if (line.trim() === "") {
      flushPara(`${key}-p`);
      flushList(`${key}-l`);
      return;
    }

    // Заголовки
    if (line.startsWith("### ")) {
      flushPara(`${key}-p`);
      flushList(`${key}-l`);
      blocks.push(
        <h4 key={`${key}-h4`} className="mt-5 mb-1 font-[family-name:var(--font-cormorant)] text-lg font-semibold text-mystic-text">
          {renderInline(line.slice(4), `${key}-h4`)}
        </h4>
      );
      return;
    }
    if (line.startsWith("## ")) {
      flushPara(`${key}-p`);
      flushList(`${key}-l`);
      blocks.push(
        <h3 key={`${key}-h3`} className="mt-6 mb-1 font-[family-name:var(--font-cormorant)] text-xl font-bold text-gold-gradient">
          {renderInline(line.slice(3), `${key}-h3`)}
        </h3>
      );
      return;
    }
    if (line.startsWith("# ")) {
      flushPara(`${key}-p`);
      flushList(`${key}-l`);
      blocks.push(
        <h2 key={`${key}-h2`} className="mt-6 mb-2 font-[family-name:var(--font-cormorant)] text-2xl font-bold text-gold-gradient">
          {renderInline(line.slice(2), `${key}-h2`)}
        </h2>
      );
      return;
    }

    // Списки
    const ulMatch = line.match(/^[-*]\s+(.*)$/);
    const olMatch = line.match(/^\d+[.)]\s+(.*)$/);
    if (ulMatch || olMatch) {
      flushPara(`${key}-p`);
      const ordered = Boolean(olMatch);
      const item = (ulMatch ? ulMatch[1] : olMatch![1]).trim();
      if (!list || list.ordered !== ordered) {
        flushList(`${key}-l`);
        list = { ordered, items: [item] };
      } else {
        list.items.push(item);
      }
      return;
    }

    // Абзац
    para.push(line.trim());
  });

  flushPara("md-end-p");
  flushList("md-end-l");

  return <div className="text-sm sm:text-[15px]">{blocks}</div>;
}
