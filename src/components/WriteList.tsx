"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Post } from "@/lib/types";
import { fullDate } from "@/lib/format";
import { excerpt } from "@/lib/markdown";
import Nav from "./Nav";
import Dither from "./Dither";
import Footer from "./Footer";
import EditorSheet from "./EditorSheet";

const pad = (n: number) => String(n + 1).padStart(2, "0");
const when = (p: Post) => p.publishedAt ?? p.updatedAt;
const readMin = (body: string) => Math.max(1, Math.round(body.replace(/\s/g, "").length / 500));

export default function WriteList({ posts: initial, writable, editId = null }: { posts: Post[]; writable: boolean; editId?: string | null }) {
  const router = useRouter();
  const [posts, setPosts] = useState(initial);
  const [editing, setEditing] = useState<Post | null>(() => (writable && editId ? initial.find((p) => p.id === editId) ?? null : null));
  const [busy, setBusy] = useState(false);
  const tags = useMemo(() => [...new Set(posts.map((p) => p.tag).filter(Boolean))], [posts]);
  const sorted = useMemo(() => [...posts].sort((a, b) => when(b).localeCompare(when(a))), [posts]);
  const drafts = posts.filter((p) => p.status === "draft").length;

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

  return (
    <div id="top">
      <section className="w-hero">
        <Nav onAdd={writable ? () => void newDraft() : undefined} writable={writable} />
        <Dither shape="square" className="w-canvas" />
        <div className="w-title">
          <div className="kicker">
            02 — {posts.length - drafts} essays{drafts ? `, ${drafts} drafts` : ""}
          </div>
          <h1>
            Writing<span style={{ color: "var(--ac)" }}>,</span>
            <br />
            <span className="sub">
              mostly about building
              <br />
              and remembering.
            </span>
          </h1>
        </div>
      </section>
      <div className="wrap">
        {sorted.map((p, i) => (
          <div key={p.id} className={`g12 prow${p.status === "draft" ? " draft" : ""}`} onClick={() => open(p)}>
            <div className="c3">
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
        {!posts.length && <p className="empty-note">Nothing written yet.</p>}
      </div>
      <Footer />
      <div className={`veil editor-veil${editing ? " open" : ""}`} inert={!editing} onMouseDown={(e) => e.target === e.currentTarget && closeEditor()}>
        <div className="sheet editor-sheet">{editing && <EditorSheet key={editing.id} post={editing} tags={tags} onChange={(p) => setPosts((x) => x.map((y) => (y.id === p.id ? p : y)))} onClose={closeEditor} onDelete={(id) => (setPosts((x) => x.filter((y) => y.id !== id)), closeEditor())} />}</div>
      </div>
    </div>
  );
}
