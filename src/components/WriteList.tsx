"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Post } from "@/lib/types";
import { fullDate } from "@/lib/format";
import { excerpt } from "@/lib/markdown";
import Link from "next/link";
import Bizcard, { tiltHandlers } from "./Bizcard";
import Nav from "./Nav";
import Dither from "./Dither";
import Fields from "./Fields";
import { SearchOverlay } from "./Overlays";
import Footer from "./Footer";
import EditorSheet from "./EditorSheet";

const pad = (n: number) => String(n + 1).padStart(2, "0");
const when = (p: Post) => p.publishedAt ?? p.updatedAt;
const readMin = (body: string) => Math.max(1, Math.round(body.replace(/\s/g, "").length / 500));

export default function WriteList({ posts: initial, items, labs, writable, editId = null }: { posts: Post[]; items: number; labs: number; writable: boolean; editId?: string | null }) {
  const router = useRouter();
  const [posts, setPosts] = useState(initial);
  const [editing, setEditing] = useState<Post | null>(() => (writable && editId ? initial.find((p) => p.id === editId) ?? null : null));
  const [busy, setBusy] = useState(false);
  const tags = useMemo(() => [...new Set(posts.map((p) => p.tag).filter(Boolean))], [posts]);
  const [reorder, setReorder] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  const [search, setSearch] = useState(false);
  const shown = focus ? posts.filter((p) => p.tag === focus) : posts;
  const [dragId, setDragId] = useState<string | null>(null);

  const openEditor = (p: Post) => {
    setEditing(p);
    window.history.replaceState(null, "", `/write?edit=${p.id}`);
  };
  const closeEditor = () => {
    setEditing(null);
    window.history.replaceState(null, "", "/write");
  };
  useEffect(() => {
    document.body.style.overflow = editing ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [editing]);
  const newDraft = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/posts", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      if (!res.ok) throw new Error(String(res.status));
      const { post } = (await res.json()) as { post: Post };
      setPosts((p) => [post, ...p]);
      openEditor(post);
    } finally {
      setBusy(false);
    }
  };
  const open = (p: Post) => (p.status === "draft" ? writable && openEditor(p) : router.push(`/write/${p.slug}`));

  /** Press the handle and move: the row follows the pointer; on release every row's pos is saved. */
  const startDrag = (id: string, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragId(id);
    const onMove = (ev: PointerEvent) => {
      const hit = [...document.querySelectorAll<HTMLElement>("[data-post]")].find((el) => {
        const r = el.getBoundingClientRect();
        return ev.clientY >= r.top && ev.clientY <= r.bottom;
      });
      const over = hit?.dataset.post;
      if (!over || over === id) return;
      setPosts((prev) => {
        const a = prev.findIndex((p) => p.id === id);
        const b = prev.findIndex((p) => p.id === over);
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
      setPosts((prev) => {
        const next = prev.map((p, i) => ({ ...p, pos: i + 1 }));
        next.forEach((p) => void fetch(`/api/posts/${p.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ pos: p.pos }) }));
        return next;
      });
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div id="top">
      <section className="hero" {...tiltHandlers}>
        <Nav
          onSearch={() => setSearch(true)}
          onAdd={writable && !reorder ? () => void newDraft() : undefined}
          writable={writable}
          extra={
            writable && (
              <a href="#edit" className={reorder ? "on" : ""} onClick={(e) => (e.preventDefault(), setReorder((r) => !r))}>
                {reorder ? "done" : "edit"}
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
            <span className="mute">{items}</span>
          </Link>
          <a href="#writing" className="on">
            <span>Writing</span>
            <span className="mute">{posts.length}</span>
          </a>
          <Link href="/#cv">
            <span>About / CV</span>
            <span className="mute">↗</span>
          </Link>
          <a href="#search" className="gap" onClick={(e) => (e.preventDefault(), setSearch(true))}>
            <span>Search</span>
            <span className="mute">/</span>
          </a>
          {writable && (
            <a href="#add" onClick={(e) => (e.preventDefault(), void newDraft())}>
              <span>New draft</span>
              <span className="mute">+</span>
            </a>
          )}
          {writable && (
            <a href="#edit" className={reorder ? "on" : ""} onClick={(e) => (e.preventDefault(), setReorder((r) => !r))}>
              <span>{reorder ? "Done" : "Edit"}</span>
              <span className="mute">{reorder ? "✓" : "≡"}</span>
            </a>
          )}
        </Bizcard>
        <Dither shape="cube" className="hero-canvas" />
        <h1>
          Writing, mostly<span className="ac">.</span>
          <br />
          <span className="sub">Builds, remembers.</span>
        </h1>
        <div className="hero-foot">
          <a href="#fields" className="btn-pill">
            Fields ↓
          </a>
          <span className="mute">{posts.filter((p) => p.status === "published").length} essays</span>
        </div>
      </section>
      <Fields
        shape="cube"
        noun="essays"
        leaves={posts.map((p) => ({ id: p.id, href: p.status === "draft" ? `/write?edit=${p.id}` : `/write/${p.slug}`, title: p.title || "Untitled", tag: p.tag, kind: p.status === "draft" ? "Draft" : "Essay", sub: p.subtitle || excerpt(p.body, 90), date: p.status === "draft" ? "draft" : fullDate(when(p)) }))}
        tags={tags}
        focus={focus}
        onFocus={setFocus}
      />
      <div id="writing" className="wrap" style={{ paddingTop: 96 }}>
        <div className="g12 arch-head">
          <div className="c3" style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
            <span className="sec-no">02</span>
            <span className="sec-title">Writing</span>
          </div>
          <div className="c9">
            <span className="mute">Showing</span>
            <span className={focus ? "on" : ""}>{focus ?? "Everything"}</span>
            <span className="mute">
              {shown.length} / {posts.length}
            </span>
            {focus && (
              <a href="#writing" className="ulink" onClick={(e) => (e.preventDefault(), setFocus(null))}>
                Clear ×
              </a>
            )}
          </div>
        </div>
        {shown.map((p, i) => (
          <div key={p.id} data-post={p.id} className={`g12 prow${p.status === "draft" ? " draft" : ""}${reorder ? " editable" : ""}${dragId === p.id ? " dragging" : ""}`} onClick={() => !reorder && open(p)}>
            <div className="c3">
              {reorder && (
                <span className="cv-handle" title="끌어서 순서 바꾸기" onPointerDown={(e) => startDrag(p.id, e)}>
                  ≡
                </span>
              )}
              <span>{pad(i)}</span>
              {p.status === "draft" ? "Draft" : fullDate(when(p))}
            </div>
            <div className="ptitle">{p.title || "Untitled"}</div>
            <div className="pex">
              {p.subtitle || excerpt(p.body, 80)}
              <br />
              <small>{readMin(p.body)} min read</small>
            </div>
          </div>
        ))}
        {!shown.length && <p className="empty-note">Nothing written here yet.</p>}
      </div>
      <Footer />
      {search && <SearchOverlay onClose={() => setSearch(false)} />}
      <div className={`veil editor-veil${editing ? " open" : ""}`} inert={!editing} onMouseDown={(e) => e.target === e.currentTarget && closeEditor()}>
        <div className="sheet editor-sheet">{editing && <EditorSheet key={editing.id} post={editing} tags={tags} onChange={(p) => setPosts((x) => x.map((y) => (y.id === p.id ? p : y)))} onClose={closeEditor} onDelete={(id) => (setPosts((x) => x.filter((y) => y.id !== id)), closeEditor())} />}</div>
      </div>
    </div>
  );
}
