"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Work } from "@/lib/types";
import { firstImage } from "@/lib/markdown";

/** 작업 목록. 행에 마우스를 올리면 오른쪽 여백에 썸네일과 한 줄 메모, 클릭하면 상세. */
export default function Works({ works, writable }: { works: Work[]; writable: boolean }) {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [top, setTop] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const enter = (w: Work) => {
    clearTimeout(timer.current);
    const el = rowRefs.current.get(w.id);
    const list = listRef.current;
    if (el && list) setTop(el.getBoundingClientRect().top - list.getBoundingClientRect().top);
    setHover(w.id);
    setLeaving(false);
  };
  const leave = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setLeaving(true), 160);
  };
  const hv = hover ? works.find((w) => w.id === hover) ?? null : null;
  const thumbOf = (w: Work) => w.thumb || firstImage(w.body);
  const shown = !!hv && !leaving;
  const open = (w: Work) => router.push(w.status === "draft" ? `/portfolio/edit/${w.id}` : `/portfolio/${w.slug}`);

  return (
    <section className="grid cv-block" ref={listRef} style={{ position: "relative" }}>
      <div>
        <div className="cv-label">작업</div>
      </div>
      <div>
        <div className="cv-line" />
        {works.length === 0 && writable && <div className="cv-note">오른쪽 위 + 로 첫 작업을 남기세요.</div>}
        {works.map((w) => (
          <div
            key={w.id}
            ref={(el) => {
              if (el) rowRefs.current.set(w.id, el);
              else rowRefs.current.delete(w.id);
            }}
            className={`row link${hover === w.id && shown ? " on" : ""}${w.status === "draft" ? " draft" : ""}`}
            onMouseEnter={() => enter(w)}
            onMouseLeave={leave}
            onClick={() => open(w)}
          >
            <span className="row-line" />
            <span className="row-title">{w.title || "제목 없음"}</span>
            {w.status === "draft" && <span className="row-meta domain">초안</span>}
            {w.kind && <span className="row-meta tagname">{w.kind}</span>}
            {w.role && <span className="row-meta">{w.role}</span>}
            <span className="row-meta date">{w.year}</span>
          </div>
        ))}
      </div>
      <div />

      <div
        className="work-preview"
        onMouseEnter={() => clearTimeout(timer.current)}
        onMouseLeave={leave}
        onClick={() => hv && open(hv)}
        style={{
          top,
          opacity: shown ? 1 : 0,
          transform: shown ? "translateY(0)" : "translateY(4px)",
          transition: shown ? "opacity .35s ease-out, transform .35s ease-out" : "opacity .18s ease-out, transform .18s ease-out",
          visibility: shown ? "visible" : "hidden",
        }}
      >
        {hv && (
          <>
            <div className="thumb" style={{ height: 150 }}>
              {thumbOf(hv) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbOf(hv)} alt="" />
              ) : (
                <span>이미지</span>
              )}
            </div>
            <div className="work-note">{hv.note}</div>
            <div className="pv-url">/portfolio/{hv.slug} ↗</div>
          </>
        )}
      </div>
    </section>
  );
}
