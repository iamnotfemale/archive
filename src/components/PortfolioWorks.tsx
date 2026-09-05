"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Work } from "@/lib/types";
import { firstImage } from "@/lib/markdown";
import WorkEditorSheet from "./WorkEditorSheet";

const INK = "#1F1D1A";
const INK_45 = "rgba(31,29,26,.45)";

type Props = { works: Work[]; writable: boolean; editId?: string | null };

/** "작업" 섹션 + 오른쪽 위 "+" + 목록 위에 떠오르는 편집기. */
export default function PortfolioWorks({ works: initial, writable, editId = null }: Props) {
  const router = useRouter();
  const [works, setWorks] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Work | null>(() => (writable && editId ? initial.find((w) => w.id === editId) ?? null : null));

  // hover preview
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

  /* ---------- editor overlay ---------- */
  const openEditor = (w: Work) => {
    setHover(null);
    setEditing(w);
    window.history.replaceState(null, "", `/portfolio?edit=${w.id}`);
  };
  const closeEditor = () => {
    setEditing(null);
    window.history.replaceState(null, "", "/portfolio");
  };
  useEffect(() => {
    document.body.style.overflow = editing ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [editing]);

  const create = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/works", { method: "POST" });
      if (!res.ok) throw new Error(String(res.status));
      const { work } = (await res.json()) as { work: Work };
      setWorks((prev) => [work, ...prev]);
      openEditor(work);
    } catch {
      /* stays on the list */
    } finally {
      setBusy(false);
    }
  };
  const onChange = (w: Work) => setWorks((prev) => prev.map((x) => (x.id === w.id ? w : x)));
  const onDelete = (id: string) => {
    setWorks((prev) => prev.filter((x) => x.id !== id));
    closeEditor();
  };
  const open = (w: Work) => (w.status === "draft" ? writable && openEditor(w) : router.push(`/portfolio/${w.slug}`));

  const shownWorks = writable ? works : works.filter((w) => w.status === "published");
  if (shownWorks.length === 0 && !writable) return null;

  return (
    <>
      {writable && (
        <div className="corner plus" title="새 작업" style={{ transform: editing ? "rotate(45deg)" : "none", color: busy || editing ? INK_45 : INK }} onClick={() => (editing ? closeEditor() : void create())}>
          +
        </div>
      )}

      <section className="grid cv-block" ref={listRef} style={{ position: "relative" }}>
        <div>
          <div className="cv-label">작업</div>
        </div>
        <div>
          <div className="cv-line" />
          {shownWorks.length === 0 && <div className="cv-note">오른쪽 위 + 로 첫 작업을 남기세요.</div>}
          {shownWorks.map((w) => (
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

      <div
        className={`veil editor-veil${editing ? " open" : ""}`}
        inert={!editing}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) closeEditor();
        }}
      >
        <div className="sheet editor-sheet">{editing && <WorkEditorSheet key={editing.id} work={editing} onChange={onChange} onClose={closeEditor} onDelete={onDelete} />}</div>
      </div>
    </>
  );
}
