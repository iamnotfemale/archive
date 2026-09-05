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

/** 글 편집기. 목록 위 베일 안에서 뜬다. 제목 · 부제목 · 주소 · 본문. */
export default function EditorSheet({ post, tags, onChange, onClose, onDelete }: Props) {
  const [title, setTitle] = useState(post.title);
  const [subtitle, setSubtitle] = useState(post.subtitle);
  const [body, setBody] = useState(post.body);
  const [tag, setTag] = useState(post.tag);
  const [tagF, setTagF] = useState(false);
  const [scope, setScope] = useState<PostScope>(post.scope);
  const [slug, setSlug] = useState(/^d-[0-9a-f]{8}$/.test(post.slug) ? slugify(post.title) : post.slug);
  const [status, setStatus] = useState(post.status);
  const [stage, setStage] = useState<0 | 1 | 2 | 3>(0); // 0 closed · 1 form · 2 ink · 3 done
  const [save, setSave] = useState<"saved" | "dirty" | "saving" | "failed">("saved");
  const [note, setNote] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const subtitleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const slugTouched = useRef(!/^d-[0-9a-f]{8}$/.test(post.slug));
  const lastSaved = useRef({ title: post.title, subtitle: post.subtitle, body: post.body });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setTimeout(() => titleRef.current?.focus(), 80);
  }, []);

  const patch = useCallback(
    async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/posts/${post.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? String(res.status));
      }
      const json = (await res.json()) as { post: Post };
      onChange(json.post);
      return json;
    },
    [post.id, onChange],
  );

  /* ---------- autosave, 900ms after the last keystroke ---------- */
  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (title === lastSaved.current.title && subtitle === lastSaved.current.subtitle && body === lastSaved.current.body) return;
    setSave("saving");
    try {
      await patch({ title, subtitle, body });
      lastSaved.current = { title, subtitle, body };
      setSave("saved");
    } catch {
      setSave("failed");
    }
  }, [title, subtitle, body, patch]);

  useEffect(() => {
    if (title === lastSaved.current.title && subtitle === lastSaved.current.subtitle && body === lastSaved.current.body) return;
    setSave("dirty");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 900);
    return () => clearTimeout(timer.current);
  }, [title, subtitle, body, flush]);

  // 주소를 손대기 전에는 영문 제목을 따라간다
  const onTitle = (v: string) => {
    setTitle(v);
    if (!slugTouched.current && status === "draft" && /[a-z]/i.test(v)) setSlug(slugify(v));
  };

  const saveSlug = async () => {
    const s = slug.trim().toLowerCase();
    if (!s || s === post.slug) return;
    if (!SLUG_RE.test(s)) {
      setNote("주소는 영문 소문자·숫자·하이픈만");
      return;
    }
    try {
      await patch({ slug: s });
      setSlug(s);
      setNote("");
    } catch (e) {
      setNote(e instanceof Error && e.message === "slug_taken" ? "이미 쓰는 주소입니다" : "주소를 저장하지 못했습니다");
    }
  };

  const close = async () => {
    await flush();
    onClose();
  };

  /* ---------- publish ---------- */
  const openPanel = () => {
    if (stage !== 0) return;
    setStage(1);
    setNote("");
  };
  const closePanel = () => {
    setStage(0);
    setNote("");
  };
  const publish = async () => {
    if (stage !== 1) return;
    const s = slug.trim().toLowerCase();
    if (!SLUG_RE.test(s)) {
      setNote("주소는 영문 소문자·숫자·하이픈만");
      return;
    }
    setStage(2);
    try {
      await flush();
      await patch({ tag: tag.trim(), scope, slug: s, status: "published" });
      setSlug(s);
      setStatus("published");
      setTimeout(() => setStage(3), 420);
    } catch (e) {
      setStage(1);
      const code = e instanceof Error ? e.message : "";
      setNote(code === "slug_taken" ? "이미 쓰는 주소입니다" : code === "locked" ? "열쇠가 없습니다" : "잠시 뒤에 다시 시도해 주세요");
    }
  };
  const unpublish = async () => {
    try {
      await patch({ status: "draft" });
      setStatus("draft");
      setStage(0);
    } catch {
      setNote("잠시 뒤에 다시 시도해 주세요");
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
    } catch {
      setNote("잠시 뒤에 다시 시도해 주세요");
    }
  };

  const keyRef = useRef((e: KeyboardEvent) => void e);
  useEffect(() => {
    keyRef.current = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        if (stage === 1) closePanel();
        else void close();
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

  const chars = body.replace(/\s/g, "").length;
  const savedLabel = save === "saving" ? "저장 중" : save === "dirty" ? "쓰는 중" : save === "failed" ? "저장 실패" : status === "published" ? "발행됨" : "저장됨";
  const open = stage >= 1;

  return (
    <div className="editor">
      <div className="sheet-head">
        <span className="pv-esc" onClick={() => void close()}>
          닫기
        </span>
        <span className="sheet-status">
          {savedLabel} · {chars.toLocaleString()}자
        </span>
      </div>

      <input ref={titleRef} className="editor-title" value={title} onChange={(e) => onTitle(e.target.value)} placeholder="제목" spellCheck={false} onKeyDown={(e) => e.key === "Enter" && subtitleRef.current?.focus()} />
      <input ref={subtitleRef} className="editor-subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="부제목" spellCheck={false} onKeyDown={(e) => e.key === "Enter" && bodyRef.current?.focus()} />
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
        {note && <span className="editor-note">{note}</span>}
      </div>
      <textarea ref={bodyRef} className="editor-body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="본문" spellCheck={false} />

      <div className="pub" style={{ maxHeight: stage === 0 ? 0 : stage === 3 ? 110 : 300, opacity: open ? 1 : 0, filter: stage === 2 ? "blur(2px)" : "blur(0)" }} inert={!open}>
        <div className="pub-inner">
          {(stage === 1 || stage === 2) && (
            <>
              <div className="pub-field">
                <input value={tag} onChange={(e) => setTag(e.target.value)} onFocus={() => setTagF(true)} onBlur={() => setTagF(false)} placeholder="태그" />
              </div>
              <TagSuggest tags={tags} input={tag} open={tagF} onPick={setTag} />
              <div className="pub-row">
                {(["public", "unlisted"] as PostScope[]).map((s) => (
                  <span key={s} className="pub-scope" style={{ color: scope === s ? INK : DIM }} onClick={() => setScope(s)}>
                    {s === "public" ? "전체 공개" : "링크 있는 사람만"}
                  </span>
                ))}
                <span style={{ flex: 1 }} />
                <span className="pub-slug">/write/{slug}</span>
              </div>
              <div className="pub-foot">
                <span style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <span className="pv-esc" onClick={closePanel}>
                    Esc 로 닫기
                  </span>
                  {status === "published" && (
                    <span className="pv-esc" onClick={() => void unpublish()}>
                      초안으로
                    </span>
                  )}
                </span>
                <span className="pub-go" onClick={() => void publish()}>
                  {status === "published" ? "다시 발행하기" : "발행하기"}
                </span>
              </div>
            </>
          )}
          {stage === 3 && (
            <div className="pub-done">
              <span>발행되었습니다.</span>
              <a href={`/write/${slug}`} className="pub-link">
                /write/{slug} ↗
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="editor-bar">
        <span style={{ display: "flex", gap: 16, alignItems: "baseline", flexWrap: "wrap" }}>
          <span className="pv-esc" style={{ cursor: "default" }}>
            {tag.trim() ? `태그 ${tag.trim()}` : "태그 없음"}
            {status === "published" ? " · 발행됨" : " · 초안"}
          </span>
          <span className="pv-esc" onClick={() => void remove()} style={{ color: confirmDel ? INK : undefined }}>
            {confirmDel ? "정말 지우기" : "지우기"}
          </span>
        </span>
        <span className="pub-btn" style={{ color: open ? DIM : INK }} onClick={openPanel}>
          발행
        </span>
      </div>
    </div>
  );
}
