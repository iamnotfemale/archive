"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Post, PostScope } from "@/lib/types";
import { slugify } from "@/lib/markdown";
import TagSuggest from "./TagSuggest";

type Props = {
  post: Post;
  tags: string[];
  onChange: (post: Post) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
};

const INK = "#1F1D1A";
const DIM = "rgba(31,29,26,.42)";
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;
const FIELDS = ["title", "subtitle", "body", "tag", "scope"] as const;
type Field = (typeof FIELDS)[number];
type Draft = Pick<Post, Field>;

/** 글 편집기. 목록 위 베일 안에서 뜬다. 제목 · 부제목 · 주소 · 태그 · 본문, 아래 "발행" 한 번. */
export default function EditorSheet({ post, tags, onChange, onClose, onDelete }: Props) {
  const [d, setD] = useState<Draft>({ title: post.title, subtitle: post.subtitle, body: post.body, tag: post.tag, scope: post.scope });
  const [tagF, setTagF] = useState(false);
  const [slug, setSlug] = useState(/^d-[0-9a-f]{8}$/.test(post.slug) ? slugify(post.title) : post.slug);
  const [status, setStatus] = useState(post.status);
  const [busy, setBusy] = useState<"" | "publish" | "unpublish">("");
  const [ink, setInk] = useState(false);
  const [save, setSave] = useState<"saved" | "dirty" | "saving" | "failed">("saved");
  const [note, setNote] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const subtitleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const slugTouched = useRef(!/^d-[0-9a-f]{8}$/.test(post.slug));
  const [savedSlug, setSavedSlug] = useState(post.slug);
  const lastSaved = useRef<Draft>({ ...d });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setTimeout(() => (post.title ? bodyRef : titleRef).current?.focus(), 80);
  }, [post.title]);

  const set = (k: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setD((p) => ({ ...p, [k]: e.target.value }));

  const patch = useCallback(
    async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/posts/${post.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? String(res.status));
      }
      const json = (await res.json()) as { post: Post };
      onChange(json.post);
      return json.post;
    },
    [post.id, onChange],
  );

  const explain = (e: unknown) => {
    const code = e instanceof Error ? e.message : "";
    return code === "slug_taken" ? "이미 쓰는 주소입니다" : code === "invalid_slug" ? "주소는 영문 소문자·숫자·하이픈만" : code === "locked" ? "열쇠가 없습니다 · /key 로 다시 들어오세요" : code === "no_database" ? "데이터베이스가 연결되지 않았습니다" : "저장하지 못했습니다 · 잠시 뒤 다시";
  };

  /* ---------- autosave (everything but slug/status), 900ms after the last keystroke ---------- */
  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (!FIELDS.some((k) => d[k] !== lastSaved.current[k])) return;
    setSave("saving");
    try {
      await patch(d);
      lastSaved.current = { ...d };
      setSave("saved");
      setNote("");
    } catch (e) {
      setSave("failed");
      setNote(explain(e));
    }
  }, [d, patch]);

  useEffect(() => {
    if (!FIELDS.some((k) => d[k] !== lastSaved.current[k])) return;
    setSave("dirty");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 900);
    return () => clearTimeout(timer.current);
  }, [d, flush]);

  // 주소를 손대기 전에는 영문 제목을 따라간다
  const onTitle = (v: string) => {
    setD((p) => ({ ...p, title: v }));
    if (!slugTouched.current && status === "draft" && /[a-z]/i.test(v)) setSlug(slugify(v));
  };

  /** Save the slug when it differs from what the server has. Returns the saved slug or null on failure. */
  const saveSlug = async (): Promise<string | null> => {
    const s = slug.trim().toLowerCase();
    if (!SLUG_RE.test(s)) {
      setNote("주소는 영문 소문자·숫자·하이픈만");
      return null;
    }
    if (s === savedSlug) return s;
    try {
      await patch({ slug: s });
      setSavedSlug(s);
      setSlug(s);
      setNote("");
      return s;
    } catch (e) {
      setNote(explain(e));
      return null;
    }
  };

  const close = async () => {
    await flush();
    onClose();
  };

  /* ---------- publish: one press ---------- */
  const publish = async () => {
    if (busy) return;
    setBusy("publish");
    setNote("");
    try {
      await flush();
      const s = await saveSlug();
      if (!s) return;
      setInk(true);
      await patch({ status: "published" });
      setStatus("published");
      setTimeout(() => setInk(false), 420);
    } catch (e) {
      setInk(false);
      setNote(explain(e));
    } finally {
      setBusy("");
    }
  };
  const unpublish = async () => {
    if (busy) return;
    setBusy("unpublish");
    try {
      await patch({ status: "draft" });
      setStatus("draft");
      setNote("");
    } catch (e) {
      setNote(explain(e));
    } finally {
      setBusy("");
    }
  };
  const remove = async () => {
    if (!confirmDel) {
      setConfirmDel(true);
      setTimeout(() => setConfirmDel(false), 4000);
      return;
    }
    clearTimeout(timer.current);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(String(res.status));
      onDelete(post.id);
    } catch (e) {
      setNote(explain(e));
    }
  };

  const keyRef = useRef((e: KeyboardEvent) => void e);
  useEffect(() => {
    keyRef.current = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        void close();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        void flush();
      }
    };
  });
  useEffect(() => {
    const k = (e: KeyboardEvent) => keyRef.current(e);
    document.addEventListener("keydown", k, true);
    return () => document.removeEventListener("keydown", k, true);
  }, []);

  const chars = d.body.replace(/\s/g, "").length;
  const savedLabel = save === "saving" ? "저장 중" : save === "dirty" ? "쓰는 중" : save === "failed" ? "저장 실패" : "저장됨";

  return (
    <div className="editor" style={{ filter: ink ? "blur(2px)" : "blur(0)", transition: "filter .3s ease-out" }}>
      <div className="sheet-head">
        <span className="pv-esc" onClick={() => void close()}>
          닫기
        </span>
        <span className="sheet-status">
          {savedLabel} · {chars.toLocaleString()}자
        </span>
      </div>

      <input ref={titleRef} className="editor-title" value={d.title} onChange={(e) => onTitle(e.target.value)} placeholder="제목" spellCheck={false} onKeyDown={(e) => e.key === "Enter" && subtitleRef.current?.focus()} />
      <input ref={subtitleRef} className="editor-subtitle" value={d.subtitle} onChange={set("subtitle")} placeholder="부제목" spellCheck={false} onKeyDown={(e) => e.key === "Enter" && bodyRef.current?.focus()} />
      <div className="editor-meta slug">
        <span>/write/</span>
        <input
          value={slug}
          onChange={(e) => {
            slugTouched.current = true;
            setSlug(e.target.value);
          }}
          onBlur={() => void saveSlug()}
          placeholder="주소"
          spellCheck={false}
          style={{ width: Math.max(4, slug.length) + "ch" }}
        />
      </div>
      <div className="editor-meta tagrow">
        <input value={d.tag} onChange={set("tag")} onFocus={() => setTagF(true)} onBlur={() => setTagF(false)} placeholder="태그" />
      </div>
      <TagSuggest tags={tags} input={d.tag} open={tagF} onPick={(t) => setD((p) => ({ ...p, tag: t }))} />
      <textarea ref={bodyRef} className="editor-body" value={d.body} onChange={set("body")} placeholder="본문" spellCheck={false} />

      <div className="editor-bar">
        <span className="bar-left">
          <span className="pv-esc" style={{ cursor: "default", color: status === "published" ? INK : undefined }}>
            {status === "published" ? "발행됨" : "초안"}
          </span>
          {status === "published" && (
            <a href={`/write/${savedSlug}`} className="pv-esc" target="_blank" rel="noreferrer">
              보기 ↗
            </a>
          )}
          {status === "published" && (
            <span className="pv-esc" onClick={() => void unpublish()}>
              {busy === "unpublish" ? "되돌리는 중" : "초안으로"}
            </span>
          )}
          <span className="pv-esc" onClick={() => void remove()} style={{ color: confirmDel ? INK : undefined }}>
            {confirmDel ? "정말 지우기" : "지우기"}
          </span>
          {note && <span className="pv-esc editor-note-bar">{note}</span>}
        </span>
        <span className="bar-right">
          {(["public", "unlisted"] as PostScope[]).map((s) => (
            <span key={s} className="pub-scope" style={{ color: d.scope === s ? INK : DIM }} onClick={() => setD((p) => ({ ...p, scope: s }))}>
              {s === "public" ? "전체 공개" : "링크만"}
            </span>
          ))}
          <span className="pub-btn" style={{ color: busy === "publish" ? DIM : INK }} onClick={() => void publish()}>
            {busy === "publish" ? "발행 중" : status === "published" ? "다시 발행" : "발행"}
          </span>
        </span>
      </div>
    </div>
  );
}
