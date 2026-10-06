"use client";

import { useEffect, useRef, useState } from "react";
import type { Item } from "@/lib/types";
import { dayLabel } from "@/lib/format";
import TagSuggest from "./TagSuggest";

/* ---------- search: full-screen, instant ---------- */

export function SearchOverlay({ items, onClose }: { items: Item[]; onClose: () => void }) {
  const [q, setQ] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);
  const ql = q.trim().toLowerCase();
  const results = ql ? items.filter((i) => [i.title, i.memo, i.domain, i.tag, i.url].some((s) => s.toLowerCase().includes(ql))) : [];
  return (
    <div className="search-ov">
      <div className="head">
        <span className="mute">Search the archive</span>
        <a href="#" className="x" onClick={(e) => (e.preventDefault(), onClose())}>
          ×
        </a>
      </div>
      <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type…" spellCheck={false} />
      <div className="results">
        {results.map((r, i) => (
          <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="srow">
            <span className="n">{String(i + 1).padStart(2, "0")}</span>
            <span className="t">{r.title}</span>
            <span className="meta">{r.domain}</span>
            <span className="meta" style={{ textAlign: "right" }}>
              {dayLabel(r.createdAt)}
            </span>
          </a>
        ))}
      </div>
      <div className="note">
        {ql ? `${results.length} found` : `${items.length} links indexed`} · Esc to close
      </div>
    </div>
  );
}

/* ---------- add / edit: dark drawer from the right ---------- */

export type DrawerState = { mode: "add"; url?: string } | { mode: "edit"; item: Item };

export function AddDrawer({ state, tags, onClose, onSaved, onDeleted }: { state: DrawerState; tags: string[]; onClose: () => void; onSaved: (item: Item, existing: boolean) => void; onDeleted: (id: string) => void }) {
  const editing = state.mode === "edit" ? state.item : null;
  const [url, setUrl] = useState(state.mode === "add" ? state.url ?? "" : editing!.url);
  const [title, setTitle] = useState(editing?.title ?? "");
  const [memo, setMemo] = useState(editing?.memo ?? "");
  const [tag, setTag] = useState(editing?.tag ?? "");
  const [tagF, setTagF] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const urlRef = useRef<HTMLInputElement>(null);
  const memoRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    (editing || url ? memoRef : urlRef).current?.focus();
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fail = (code: string) => setNote(code === "locked" ? "No key — open /key?t=… first" : code === "no_database" ? "Database not connected" : "Couldn't save, try again");

  const save = async () => {
    if (busy) return;
    setBusy(true);
    setNote("");
    try {
      if (editing) {
        const res = await fetch(`/api/items/${editing.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, memo, tag }) });
        if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "err");
        onSaved(((await res.json()) as { item: Item }).item, true);
      } else {
        if (!url.trim()) return;
        const res = await fetch("/api/items", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url, memo, tag }) });
        if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "err");
        const j = (await res.json()) as { item: Item; existing: boolean };
        onSaved(j.item, j.existing);
      }
      onClose();
    } catch (e) {
      fail(e instanceof Error ? e.message : "");
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!editing) return;
    if (!confirmDel) {
      setConfirmDel(true);
      setTimeout(() => setConfirmDel(false), 4000);
      return;
    }
    const res = await fetch(`/api/items/${editing.id}`, { method: "DELETE" });
    if (res.ok) {
      onDeleted(editing.id);
      onClose();
    } else fail("err");
  };
  const enter = (e: React.KeyboardEvent) => e.key === "Enter" && void save();

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer">
        <div className="head">
          <span>{editing ? "Edit a link" : "Keep a link"}</span>
          <a href="#" className="x" onClick={(e) => (e.preventDefault(), onClose())}>
            ×
          </a>
        </div>
        <div className="body">
          {editing ? (
            <input className="url" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" onKeyDown={enter} />
          ) : (
            <input ref={urlRef} className="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a URL" spellCheck={false} onKeyDown={enter} />
          )}
          <input ref={memoRef} className="memo" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Why keep it" onKeyDown={enter} />
          <input value={tag} onChange={(e) => setTag(e.target.value)} onFocus={() => setTagF(true)} onBlur={() => setTagF(false)} placeholder="Field" onKeyDown={enter} />
          <TagSuggest tags={tags} input={tag} open={tagF} onPick={setTag} />
          <div className="foot">
            <span className="dim">
              {note || "Esc to close"}
              {editing && (
                <>
                  {" · "}
                  <a href="#" onClick={(e) => (e.preventDefault(), void remove())} style={{ color: confirmDel ? "#fff" : "inherit" }}>
                    {confirmDel ? "Really delete" : "Delete"}
                  </a>
                </>
              )}
            </span>
            <a href="#" className="go" onClick={(e) => (e.preventDefault(), void save())}>
              {busy ? "Saving…" : editing ? "Save →" : "Keep →"}
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
