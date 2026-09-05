import type { ReactNode } from "react";

/**
 * 글 본문 렌더러. 빈 줄로 문단을 나누고, 아주 작은 마크다운만 이해합니다.
 *   ## 소제목 · > 인용 · - 목록 · ![캡션](이미지주소) · **굵게** · [글자](주소) · 그냥 붙여넣은 주소
 */
export function renderBody(body: string): ReactNode[] {
  const blocks = body.replace(/\r\n/g, "\n").split(/\n{2,}/);
  const out: ReactNode[] = [];
  blocks.forEach((blk, i) => {
    const t = blk.trim();
    if (!t) return;
    if (/^##\s+/.test(t)) {
      out.push(
        <h2 key={i} className="post-h">
          {inline(t.replace(/^##\s+/, ""))}
        </h2>,
      );
      return;
    }
    const img = t.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (img) {
      out.push(
        <figure key={i} className="post-fig">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img[2]} alt={img[1]} loading="lazy" />
          {img[1] && <figcaption>{img[1]}</figcaption>}
        </figure>,
      );
      return;
    }
    if (/^>\s?/.test(t)) {
      out.push(
        <blockquote key={i} className="post-quote">
          {inline(t.replace(/^>\s?/gm, ""))}
        </blockquote>,
      );
      return;
    }
    const lines = t.split("\n");
    if (lines.every((l) => /^[-*]\s+/.test(l))) {
      out.push(
        <ul key={i} className="post-list">
          {lines.map((l, j) => (
            <li key={j}>{inline(l.replace(/^[-*]\s+/, ""))}</li>
          ))}
        </ul>,
      );
      return;
    }
    out.push(
      <p key={i} className="post-p">
        {inline(t)}
      </p>,
    );
  });
  return out;
}

const TOKEN = /(\*\*[^*\n]+\*\*|\[[^\]\n]+\]\([^)\s]+\)|https?:\/\/[^\s<>"']+)/g;

function inline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const lines = text.split("\n");
  lines.forEach((line, li) => {
    if (li > 0) nodes.push(<br key={`br${li}`} />);
    const parts = line.split(TOKEN);
    parts.forEach((part, pi) => {
      if (!part) return;
      const key = `${li}-${pi}`;
      if (/^\*\*[^*]+\*\*$/.test(part)) {
        nodes.push(<strong key={key}>{part.slice(2, -2)}</strong>);
        return;
      }
      const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
      if (link) {
        nodes.push(
          <a key={key} href={link[2]} target="_blank" rel="noreferrer" className="post-a">
            {link[1]}
          </a>,
        );
        return;
      }
      if (/^https?:\/\//.test(part)) {
        const trimmed = part.replace(/[.,;:!?)]+$/, "");
        const tail = part.slice(trimmed.length);
        nodes.push(
          <a key={key} href={trimmed} target="_blank" rel="noreferrer" className="post-a">
            {trimmed.replace(/^https?:\/\//, "")}
          </a>,
        );
        if (tail) nodes.push(tail);
        return;
      }
      nodes.push(part);
    });
  });
  return nodes;
}

/** 본문에서 첫 문단을 뽑아 목록 미리보기 등에 씁니다. */
export function excerpt(body: string, max = 120): string {
  const first = body.replace(/\r\n/g, "\n").split(/\n{2,}/).map((s) => s.trim()).find((s) => s && !/^(##|!\[|>)/.test(s)) ?? "";
  const plain = first.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\n/g, " ");
  return plain.length > max ? plain.slice(0, max).trimEnd() + "…" : plain;
}

/** 제목에서 URL용 slug. 라틴 글자가 없으면(한글 제목) 짧은 무작위 id. */
export function slugify(title: string): string {
  const s = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return s.length >= 3 ? s.slice(0, 60) : Math.random().toString(36).slice(2, 8);
}
