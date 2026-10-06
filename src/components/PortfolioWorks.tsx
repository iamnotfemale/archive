"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Work } from "@/lib/types";
import WorkEditorSheet from "./WorkEditorSheet";

type Props = { works: Work[]; writable: boolean; editId?: string | null; reorder?: boolean; no: string; createRef: React.RefObject<() => void> };

/** "Works" block of the CV; the + in the nav creates, rows open the editor (drafts) or the page. */
export default function PortfolioWorks({ works: initial, writable, editId = null, reorder = false, no, createRef }: Props) {
  const router = useRouter();
  const [works, setWorks] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Work | null>(() => (writable && editId ? initial.find((w) => w.id === editId) ?? null : null));

  const openEditor = (w: Work) => {
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
  useEffect(() => {
    createRef.current = () => void create();
  });
  const onChange = (w: Work) => setWorks((prev) => prev.map((x) => (x.id === w.id ? w : x)));
  const onDelete = (id: string) => {
    setWorks((prev) => prev.filter((x) => x.id !== id));
    closeEditor();
  };
  const open = (w: Work) => (w.status === "draft" ? writable && openEditor(w) : router.push(`/portfolio/${w.slug}`));

  /** Press the handle and move: the row follows the pointer; on release every row's pos is saved. */
  const startDrag = (id: string, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragId(id);
    const onMove = (ev: PointerEvent) => {
      const hit = [...document.querySelectorAll<HTMLElement>("[data-work]")].find((el) => {
        const r = el.getBoundingClientRect();
        return ev.clientY >= r.top && ev.clientY <= r.bottom;
      });
      const over = hit?.dataset.work;
      if (!over || over === id) return;
      setWorks((prev) => {
        const a = prev.findIndex((w) => w.id === id);
        const b = prev.findIndex((w) => w.id === over);
        if (a < 0 || b < 0) return prev;
        const next = [...prev];
        const [item] = next.splice(a, 1);
        next.splice(b, 0, item);
        return next;
      });
    };
    const onUp = () => {
      setDragId(null);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setWorks((prev) => {
        const next = prev.map((w, i) => ({ ...w, pos: i + 1 }));
        next.forEach((w) => void fetch(`/api/works/${w.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ pos: w.pos }) }));
        return next;
      });
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const shownWorks = writable ? works : works.filter((w) => w.status === "published");
  if (shownWorks.length === 0 && !writable) return null;

  return (
    <>
      <section className="g12 cv-block">
        <div className="c3 cv-label">
          <span className="no">{no}</span>
          <span className="lbl">Works</span>
        </div>
        <div className="c9">
          {shownWorks.length === 0 && <p className="empty-note">Press + to add the first work.</p>}
          {shownWorks.map((w) => (
            <div
              key={w.id}
              data-work={w.id}
              className={`cv-row${reorder ? " editable" : " link"}${dragId === w.id ? " dragging" : ""}`}
              onClick={() => !reorder && open(w)}
            >
              {reorder && (
                <span className="cv-handle" title="끌어서 순서 바꾸기" onPointerDown={(e) => startDrag(w.id, e)}>
                  ≡
                </span>
              )}
              <span className="cv-title">{w.title || "Untitled"}</span>
              <span className="cv-sub-text">
                {w.status === "draft" && <span style={{ color: "var(--ac)" }}>Draft · </span>}
                {w.note || w.kind}
              </span>
              <span className="cv-when">{w.year}</span>
            </div>
          ))}
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
