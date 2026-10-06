"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LabItem } from "@/content/lab";
import Nav from "./Nav";
import Dither from "./Dither";
import Footer from "./Footer";
import Bizcard, { tiltHandlers } from "./Bizcard";
import { SearchOverlay } from "./Overlays";

const pad = (n: number) => String(n + 1).padStart(2, "0");
const blank = (): LabItem => ({ name: "", title: "", desc: "", host: "", date: new Date().toISOString().slice(0, 7).replace("-", "."), stack: "", built: "" });

export default function Lab({ items: initial, writable, archive, posts }: { items: LabItem[]; writable: boolean; archive: number; posts: number }) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState(false);
  const [save, setSave] = useState<"saved" | "dirty" | "saving" | "failed">("saved");
  const [confirm, setConfirm] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const lastSaved = useRef(JSON.stringify(initial));
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /* autosave the whole list 900ms after the last change */
  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    const json = JSON.stringify(items);
    if (json === lastSaved.current) return;
    setSave("saving");
    try {
      const res = await fetch("/api/lab", { method: "PUT", headers: { "content-type": "application/json" }, body: json });
      if (!res.ok) throw new Error(String(res.status));
      lastSaved.current = json;
      setSave("saved");
    } catch {
      setSave("failed");
    }
  }, [items]);
  useEffect(() => {
    if (JSON.stringify(items) === lastSaved.current) return;
    setSave("dirty");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 900);
    return () => clearTimeout(timer.current);
  }, [items, flush]);
  const done = async () => {
    await flush();
    setEditing(false);
    setConfirm(null);
  };

  const set = (i: number, patch: Partial<LabItem>) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const add = () => {
    setItems((xs) => [blank(), ...xs]);
    setEditing(true);
  };
  const remove = (i: number) => {
    if (confirm !== i) {
      setConfirm(i);
      setTimeout(() => setConfirm((c) => (c === i ? null : c)), 4000);
      return;
    }
    setConfirm(null);
    setItems((xs) => xs.filter((_, j) => j !== i));
  };
  /** Press the handle and move: the card follows the pointer through the grid. */
  const startDrag = (i: number, e: React.PointerEvent) => {
    e.preventDefault();
    setDragIdx(i);
    let cur = i;
    const onMove = (ev: PointerEvent) => {
      const els = [...document.querySelectorAll<HTMLElement>("[data-lab]")];
      const hit = els.findIndex((el) => {
        const r = el.getBoundingClientRect();
        return ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
      });
      if (hit < 0 || hit === cur) return;
      setItems((xs) => {
        const next = [...xs];
        const [it] = next.splice(cur, 1);
        next.splice(hit, 0, it);
        return next;
      });
      cur = hit;
      setDragIdx(hit);
    };
    const onUp = () => {
      setDragIdx(null);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const savedLabel = save === "saving" ? "저장 중" : save === "dirty" ? "고치는 중" : save === "failed" ? "저장 실패" : "저장됨";
  const field = (i: number, key: keyof LabItem, placeholder: string, cls = "") => <input className={cls} value={items[i][key]} placeholder={placeholder} onChange={(e) => set(i, { [key]: e.target.value })} spellCheck={false} />;

  return (
    <div id="top" className={editing ? "lab-editing" : ""}>
      <section className="hero" {...tiltHandlers}>
        <Nav
          onSearch={() => setSearch(true)}
          onAdd={writable ? add : undefined}
          writable={writable}
          extra={
            writable && (
              <a href="#edit" className={editing ? "on" : ""} onClick={(e) => (e.preventDefault(), editing ? void done() : setEditing(true))}>
                {editing ? "done" : "edit"}
                {editing && <span className="corner-sub"> {savedLabel}</span>}
              </a>
            )
          }
        />
        <Bizcard>
          <Link href="/">
            <span>Portfolio</span>
            <span className="mute">CV</span>
          </Link>
          <Link href="/archive">
            <span>Archive</span>
            <span className="mute">{archive}</span>
          </Link>
          <Link href="/write">
            <span>Writing</span>
            <span className="mute">{posts}</span>
          </Link>
          <a href="#lab" className="on">
            <span>Lab</span>
            <span className="mute">{items.length}</span>
          </a>
          <a href="#search" className="gap" onClick={(e) => (e.preventDefault(), setSearch(true))}>
            <span>Search</span>
            <span className="mute">/</span>
          </a>
          {writable && (
            <a href="#add" onClick={(e) => (e.preventDefault(), add())}>
              <span>New tool</span>
              <span className="mute">+</span>
            </a>
          )}
          {writable && (
            <a href="#edit" className={editing ? "on" : ""} onClick={(e) => (e.preventDefault(), editing ? void done() : setEditing(true))}>
              <span>{editing ? "Done" : "Edit"}</span>
              <span className="mute">{editing ? "✓" : "≡"}</span>
            </a>
          )}
        </Bizcard>
        <Dither shape="flask" size={88} className="hero-canvas flask" />
        <h1>
          Lab<span className="ac">.</span>
          <br />
          <span className="sub">Vibe-coded, one subdomain each.</span>
        </h1>
        <div className="hero-foot">
          <a href="#lab" className="btn-pill">
            All tools ↓
          </a>
          <span className="mute">{items.length} experiments, all live</span>
        </div>
      </section>
      <div id="lab" className="wrap" style={{ paddingTop: 96 }}>
        <div className="g12 sec-head soft">
          <div className="c3">
            <span className="sec-no">03</span>
            <span className="sec-title">Lab</span>
          </div>
          <div className="c9 sec-note">{editing ? "끌어서 순서 바꾸기 · 빈 칸은 저장돼도 안 보임" : "Small tools, built fast and left running · click any to open"}</div>
        </div>
        <div className="lab-grid">
          {items.map((x, i) =>
            editing ? (
              <div key={i} data-lab={i} className={`lab-card editable${dragIdx === i ? " dragging" : ""}`}>
                <div className="lab-frame">
                  <div className="lab-chrome">
                    <span className="cv-handle" title="끌어서 순서 바꾸기" onPointerDown={(e) => startDrag(i, e)}>
                      ≡
                    </span>
                    {field(i, "host", "host.yeoziphab.com", "host")}
                    <span className="cv-x" onClick={() => remove(i)} style={{ color: confirm === i ? "var(--ac)" : undefined }}>
                      {confirm === i ? "정말" : "×"}
                    </span>
                  </div>
                  <div className="lab-tile">
                    {field(i, "name", "name", "name")}
                    {field(i, "stack", "스택 (Next.js · Supabase)", "stack")}
                    <span className="sq" />
                  </div>
                </div>
                <div className="lab-title">
                  <span className="mute">{pad(i)}</span>
                  {field(i, "title", "제목", "t")}
                  {field(i, "date", "2026.10", "date")}
                </div>
                <div className="lab-meta">
                  <span />
                  <div>
                    {field(i, "desc", "한 줄 설명")}
                    {field(i, "built", "built in … (one evening)")}
                  </div>
                </div>
              </div>
            ) : (
              <a key={x.host + i} href={`https://${x.host}`} target="_blank" rel="noreferrer" className="lab-card">
                <div className="lab-frame">
                  <div className="lab-chrome">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                    <span className="host">{x.host}</span>
                    <span className="arrow">↗</span>
                  </div>
                  <div className="lab-tile">
                    <span className="name">
                      {x.name}
                      <span style={{ color: "var(--ac)" }}>.</span>
                    </span>
                    <span className="stack">{x.stack}</span>
                    <span className="sq" />
                  </div>
                </div>
                <div className="lab-title">
                  <span className="mute">{pad(i)}</span>
                  <span className="t">{x.title}</span>
                  <span className="mute">{x.date}</span>
                </div>
                <div className="lab-meta">
                  <span />
                  <div>
                    <p>{x.desc}</p>
                    <div className="host">
                      {x.host} {x.built && <span className="mute">· built in {x.built}</span>}
                    </div>
                  </div>
                </div>
              </a>
            ),
          )}
          {!items.length && <p className="empty-note">Nothing in the lab yet.</p>}
        </div>
      </div>
      <Footer />
      {search && <SearchOverlay onClose={() => setSearch(false)} />}
    </div>
  );
}
