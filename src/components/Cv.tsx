"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Contact, CvRow, CvSection, Profile, Work } from "@/lib/types";
import PortfolioWorks from "./PortfolioWorks";

type Props = { profile: Profile; works: Work[]; writable: boolean; editId?: string | null };

type Drag = { kind: "row"; section: string; id: string } | { kind: "section"; id: string } | { kind: "contact"; id: string };

const uid = () => Math.random().toString(36).slice(2, 8);

/** 이력 부분. "수정"을 누르면 같은 자리에서 고치고, 손잡이를 끌어 순서를 바꾼다. */
export default function Cv({ profile: initial, works, writable, editId = null }: Props) {
  const [p, setP] = useState<Profile>(initial);
  const [editing, setEditing] = useState(false);
  const [save, setSave] = useState<"saved" | "dirty" | "saving" | "failed">("saved");
  const [drag, setDrag] = useState<Drag | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null); // id of the thing about to be removed
  const lastSaved = useRef(JSON.stringify(initial));
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /* ---------- autosave (whole document), 900ms after the last change ---------- */
  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    const json = JSON.stringify(p);
    if (json === lastSaved.current) return;
    setSave("saving");
    try {
      const res = await fetch("/api/profile", { method: "PUT", headers: { "content-type": "application/json" }, body: json });
      if (!res.ok) throw new Error(String(res.status));
      lastSaved.current = json;
      setSave("saved");
    } catch {
      setSave("failed");
    }
  }, [p]);

  useEffect(() => {
    if (JSON.stringify(p) === lastSaved.current) return;
    setSave("dirty");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 900);
    return () => clearTimeout(timer.current);
  }, [p, flush]);

  const done = async () => {
    await flush();
    setEditing(false);
    setConfirm(null);
  };

  const keyRef = useRef((e: KeyboardEvent) => void e);
  useEffect(() => {
    keyRef.current = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editing && !document.querySelector(".editor-veil.open")) void done();
    };
  });
  useEffect(() => {
    const k = (e: KeyboardEvent) => keyRef.current(e);
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, []);

  /* ---------- edits ---------- */
  const setSection = (id: string, fn: (s: CvSection) => CvSection) => setP((x) => ({ ...x, sections: x.sections.map((s) => (s.id === id ? fn(s) : s)) }));
  const setRow = (sid: string, rid: string, patch: Partial<CvRow>) => setSection(sid, (s) => ({ ...s, rows: s.rows.map((r) => (r.id === rid ? { ...r, ...patch } : r)) }));
  const addRow = (sid: string) => setSection(sid, (s) => ({ ...s, rows: [...s.rows, { id: uid(), title: "", sub: "", when: "" }] }));
  const addSection = () => setP((x) => ({ ...x, sections: [...x.sections, { id: uid(), label: "", rows: [{ id: uid(), title: "", sub: "", when: "" }] }] }));
  const setContact = (id: string, patch: Partial<Contact>) => setP((x) => ({ ...x, contacts: x.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  const addContact = () => setP((x) => ({ ...x, contacts: [...x.contacts, { id: uid(), label: "", value: "", href: "" }] }));

  const removeWithConfirm = (id: string, doIt: () => void) => {
    if (confirm !== id) {
      setConfirm(id);
      setTimeout(() => setConfirm((c) => (c === id ? null : c)), 4000);
      return;
    }
    setConfirm(null);
    doIt();
  };
  const removeRow = (sid: string, rid: string) => removeWithConfirm(rid, () => setSection(sid, (s) => ({ ...s, rows: s.rows.filter((r) => r.id !== rid) })));
  const removeSection = (sid: string) => removeWithConfirm(sid, () => setP((x) => ({ ...x, sections: x.sections.filter((s) => s.id !== sid) })));
  const removeContact = (id: string) => removeWithConfirm(id, () => setP((x) => ({ ...x, contacts: x.contacts.filter((c) => c.id !== id) })));

  /* ---------- drag to reorder (live, within the same list) ---------- */
  const move = <T extends { id: string }>(list: T[], from: string, to: string): T[] => {
    const a = list.findIndex((x) => x.id === from);
    const b = list.findIndex((x) => x.id === to);
    if (a < 0 || b < 0 || a === b) return list;
    const next = [...list];
    const [item] = next.splice(a, 1);
    next.splice(b, 0, item);
    return next;
  };
  const over = (d: Drag, id: string) => {
    if (d.kind === "row") setSection(d.section, (s) => ({ ...s, rows: move(s.rows, d.id, id) }));
    else if (d.kind === "section") setP((x) => ({ ...x, sections: move(x.sections, d.id, id) }));
    else setP((x) => ({ ...x, contacts: move(x.contacts, d.id, id) }));
  };
  /** Press a handle and move: the item follows the pointer through the list (mouse and touch). */
  const startDrag = (d: Drag, e: React.PointerEvent) => {
    e.preventDefault();
    setDrag(d);
    const sel = d.kind === "row" ? `[data-section="${d.section}"] [data-row]` : d.kind === "section" ? "[data-section]" : "[data-contact]";
    const onMove = (ev: PointerEvent) => {
      const els = [...document.querySelectorAll<HTMLElement>(sel)];
      const hit = els.find((el) => {
        const r = el.getBoundingClientRect();
        return ev.clientY >= r.top && ev.clientY <= r.bottom;
      });
      const id = hit?.dataset.row ?? hit?.dataset.section ?? hit?.dataset.contact;
      if (id && id !== d.id) over(d, id);
    };
    const onUp = () => {
      setDrag(null);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const savedLabel = save === "saving" ? "저장 중" : save === "dirty" ? "고치는 중" : save === "failed" ? "저장 실패" : "저장됨";
  const cls = (base: string, d: Drag) => `${base}${editing ? " editable" : ""}${drag && drag.kind === d.kind && drag.id === d.id ? " dragging" : ""}`;

  return (
    <div className={`cv-root${editing ? " editing" : ""}`}>
      {writable && (
        <div className="corner edit-toggle" title={editing ? "완료" : "수정"} onClick={() => (editing ? void done() : setEditing(true))}>
          {editing ? "✓" : "&"}
          {editing && <span className="corner-sub">{savedLabel}</span>}
        </div>
      )}

      {/* intro */}
      <div className="grid">
        <div />
        <div className="cv-intro">
          {editing ? (
            <>
              <input className="cv-lead" value={p.intro} onChange={(e) => setP({ ...p, intro: e.target.value })} placeholder="한 문장" />
              <input className="cv-sub" value={p.sub} onChange={(e) => setP({ ...p, sub: e.target.value })} placeholder="짧은 설명" />
            </>
          ) : (
            <>
              <div className="cv-lead">{p.intro}</div>
              {p.sub && <div className="cv-sub">{p.sub}</div>}
            </>
          )}
        </div>
        <div />
      </div>

      {/* sections */}
      {p.sections.map((s) => (
        <section key={s.id} data-section={s.id} className={cls("grid cv-block", { kind: "section", id: s.id })}>
          <div>
            {editing ? (
              <div className="cv-label cv-label-edit">
                <span className="cv-handle" title="끌어서 순서 바꾸기" onPointerDown={(e) => startDrag({ kind: "section", id: s.id }, e)}>
                  ≡
                </span>
                <input value={s.label} onChange={(e) => setSection(s.id, (x) => ({ ...x, label: e.target.value }))} placeholder="섹션" />
                <span className="cv-x" onClick={() => removeSection(s.id)} style={{ color: confirm === s.id ? "#1F1D1A" : undefined }}>
                  {confirm === s.id ? "정말" : "×"}
                </span>
              </div>
            ) : (
              <div className="cv-label">{s.label}</div>
            )}
          </div>
          <div>
            <div className="cv-line" />
            {s.rows.map((r) => (
              <div key={r.id} data-row={r.id} className={cls("cv-row", { kind: "row", section: s.id, id: r.id })}>
                {editing ? (
                  <>
                    <span className="cv-handle" title="끌어서 순서 바꾸기" onPointerDown={(e) => startDrag({ kind: "row", section: s.id, id: r.id }, e)}>
                      ≡
                    </span>
                    <input className="cv-title" value={r.title} onChange={(e) => setRow(s.id, r.id, { title: e.target.value })} placeholder="이름" />
                    <input className="cv-sub-text" value={r.sub} onChange={(e) => setRow(s.id, r.id, { sub: e.target.value })} placeholder="설명" />
                    <input className="cv-when" value={r.when} onChange={(e) => setRow(s.id, r.id, { when: e.target.value })} placeholder="기간" />
                    <span className="cv-x" onClick={() => removeRow(s.id, r.id)} style={{ color: confirm === r.id ? "#1F1D1A" : undefined }}>
                      {confirm === r.id ? "정말" : "×"}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="cv-title">{r.title}</span>
                    <span className="cv-sub-text">{r.sub}</span>
                    <span className="cv-when">{r.when}</span>
                  </>
                )}
              </div>
            ))}
            {editing && (
              <div className="cv-add" onClick={() => addRow(s.id)}>
                + 항목
              </div>
            )}
          </div>
          <div />
        </section>
      ))}
      {editing && (
        <div className="grid">
          <div />
          <div className="cv-add section" onClick={addSection}>
            + 섹션
          </div>
          <div />
        </div>
      )}

      <PortfolioWorks works={works} writable={writable} editId={editId} hideAdd={editing} />

      {/* contacts */}
      {(p.contacts.length > 0 || editing) && (
        <section className="grid cv-block">
          <div>
            <div className="cv-label">연락</div>
          </div>
          <div>
            <div className="cv-line" />
            <div className="cv-contacts">
              {p.contacts.map((c) => (
                <div key={c.id} data-contact={c.id} className={cls("cv-contact", { kind: "contact", id: c.id })}>
                  {editing ? (
                    <>
                      <span className="cv-handle" title="끌어서 순서 바꾸기" onPointerDown={(e) => startDrag({ kind: "contact", id: c.id }, e)}>
                        ≡
                      </span>
                      <input className="cv-contact-label" value={c.label} onChange={(e) => setContact(c.id, { label: e.target.value })} placeholder="구분" />
                      <input className="cv-contact-value" value={c.value} onChange={(e) => setContact(c.id, { value: e.target.value })} placeholder="보이는 글자" />
                      <input className="cv-contact-href" value={c.href} onChange={(e) => setContact(c.id, { href: e.target.value })} placeholder="주소 (mailto:, https://)" spellCheck={false} />
                      <span className="cv-x" onClick={() => removeContact(c.id)} style={{ color: confirm === c.id ? "#1F1D1A" : undefined }}>
                        {confirm === c.id ? "정말" : "×"}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="cv-contact-label">{c.label}</span>
                      {c.href ? (
                        <a href={c.href} target={c.href.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer" className="cv-contact-value">
                          {c.value}
                        </a>
                      ) : (
                        <span className="cv-contact-value">{c.value}</span>
                      )}
                    </>
                  )}
                </div>
              ))}
              {editing && (
                <div className="cv-add" onClick={addContact}>
                  + 연락처
                </div>
              )}
            </div>
          </div>
          <div />
        </section>
      )}
    </div>
  );
}
