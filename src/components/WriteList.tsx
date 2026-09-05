"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Post } from "@/lib/types";
import { dayLabel, monthKey, monthLabel } from "@/lib/format";
import { excerpt } from "@/lib/markdown";
import Rail from "./Rail";

const ALL = "전체";
const ROW_MAX = 60;
const INK = "#1F1D1A";
const INK_45 = "rgba(31,29,26,.45)";

type Props = { posts: Post[]; writable: boolean };

const when = (p: Post) => p.publishedAt ?? p.updatedAt;

export default function WriteList({ posts, writable }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState(ALL);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [slashHover, setSlashHover] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);

  const tags = useMemo(() => {
    const count = new Map<string, number>();
    for (const p of posts) if (p.tag) count.set(p.tag, (count.get(p.tag) ?? 0) + 1);
    return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko")).map(([t]) => t);
  }, [posts]);

  const months = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const p of posts) {
      const k = monthKey(when(p));
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(p);
    }
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, rows]) => ({ key, label: monthLabel(key), rows: rows.sort((a, b) => when(b).localeCompare(when(a))) }));
  }, [posts]);

  const ql = q.trim().toLowerCase();
  const visible = (p: Post) => {
    if (filter !== ALL && p.tag !== filter) return false;
    if (!ql) return true;
    return [p.title, p.tag, excerpt(p.body, 400)].some((s) => s.toLowerCase().includes(ql));
  };
  const matchCount = ql ? posts.filter(visible).length : null;

  const openSearch = () => {
    setSearchOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      searchInput.current?.focus();
      searchInput.current?.select();
    }, 60);
  };
  const clearSearch = () => {
    setSearchOpen(false);
    setQ("");
  };

  const newDraft = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/posts", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      if (!res.ok) throw new Error(String(res.status));
      const { post } = (await res.json()) as { post: Post };
      document.querySelector(".page")?.classList.add("leaving"); // fade out, the editor rises in
      setTimeout(() => router.push(`/write/edit/${post.id}`), 260);
    } catch {
      setBusy(false);
      setNote("잠시 뒤에 다시 시도해 주세요");
      setTimeout(() => setNote(""), 3000);
    }
  };

  const keyRef = useRef((e: KeyboardEvent) => void e);
  useEffect(() => {
    keyRef.current = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const inInput = !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA");
      if (e.key === "Escape" && searchOpen) {
        clearSearch();
        t?.blur?.();
      } else if (e.key === "/" && !inInput) {
        e.preventDefault();
        if (searchOpen) searchInput.current?.focus();
        else openSearch();
      }
    };
  });
  useEffect(() => {
    const k = (e: KeyboardEvent) => keyRef.current(e);
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, []);

  const empty = posts.length === 0;
  const drafts = posts.filter((p) => p.status === "draft").length;
  const sideNote = empty ? "아직 쓴 글 없음" : drafts > 0 ? `초안 ${drafts}` : `쓴 글 ${posts.length}`;
  const slashTransform = searchOpen ? "rotate(24deg)" : slashHover ? "rotate(10deg)" : "none";

  const open = (p: Post) => {
    if (p.status === "draft") {
      if (writable) router.push(`/write/edit/${p.id}`);
    } else router.push(`/write/${p.slug}`);
  };

  return (
    <div className="page">
      <Rail>
        <div className="side-note">{sideNote}</div>
        {note && <div className="side-sub">{note}</div>}
        {!empty && (
          <div className="tags">
            {[ALL, ...tags].map((name, i) => (
              <span key={name} className={`tag${filter === name ? " active" : ""}`} style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }} onClick={() => setFilter(name)}>
                {name}
              </span>
            ))}
          </div>
        )}
      </Rail>

      {writable && (
        <div className="corner plus" title="새 글" style={{ color: busy ? INK_45 : INK }} onClick={() => void newDraft()}>
          +
        </div>
      )}
      <div
        className="corner slash"
        title="찾기 ( / )"
        style={{ transform: slashTransform, color: searchOpen || empty ? INK_45 : INK }}
        onMouseEnter={() => setSlashHover(true)}
        onMouseLeave={() => setSlashHover(false)}
        onClick={() => (searchOpen ? clearSearch() : openSearch())}
      >
        /
      </div>

      <div className="body">
        <div className="panel" inert={!searchOpen} style={{ maxHeight: searchOpen ? 120 : 0, opacity: searchOpen ? 1 : 0 }}>
          <div className="grid">
            <div />
            <div className="field lg" style={{ marginBottom: 36 }}>
              <input ref={searchInput} value={q} onChange={(e) => setQ(e.target.value)} placeholder="찾을 말" spellCheck={false} />
              {matchCount !== null && <span className="count">{matchCount}</span>}
            </div>
            <div />
          </div>
        </div>

        {months.map((m, mi) => {
          const anyVisible = m.rows.some(visible);
          return (
            <div key={m.key} className="grid month" style={{ opacity: anyVisible ? 1 : 0.35 }}>
              <div className="month-label-col">
                <div className="month-label">{m.label}</div>
              </div>
              <div>
                {mi > 0 && <div className="month-line" />}
                <div className="month-rows">
                  {m.rows.map((p, i) => {
                    const vis = visible(p);
                    const draft = p.status === "draft";
                    const state = draft ? "초안" : p.scope === "unlisted" ? "링크만" : "";
                    return (
                      <div key={p.id} className="row-wrap" style={{ opacity: vis ? 1 : 0, maxHeight: vis ? ROW_MAX : 0 }}>
                        <div className={`row link${draft ? " draft" : ""}`} style={{ animationDelay: `${Math.min((mi * 4 + i) * 45, 1000)}ms` }} onClick={() => open(p)}>
                          <span className="row-line" />
                          <span className="row-title">{p.title || "제목 없음"}</span>
                          {state && <span className="row-meta domain">{state}</span>}
                          {p.tag && <span className="row-meta tagname">{p.tag}</span>}
                          <span className="row-meta date">{dayLabel(when(p))}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div />
            </div>
          );
        })}
      </div>

      {empty && (
        <div className="empty-state">
          <div className="empty-state-h">아직 아무 글도 없습니다.</div>
        </div>
      )}
    </div>
  );
}
