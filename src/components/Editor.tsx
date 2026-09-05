"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Post, PostScope } from "@/lib/types";
import { slugify } from "@/lib/markdown";
import Rail from "./Rail";
import TagSuggest from "./TagSuggest";

type Props = { post: Post; drafts: Post[]; tags: string[] };

const INK = "#1F1D1A";
const DIM = "rgba(31,29,26,.42)";

function ago(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "방금";
  if (d < 3600) return `${Math.floor(d / 60)}분 전`;
  if (d < 86400) return `${Math.floor(d / 3600)}시간 전`;
  if (d < 86400 * 30) return `${Math.floor(d / 86400)}일 전`;
  return `${Math.floor(d / 86400 / 30)}달 전`;
}

export default function Editor({ post, drafts, tags }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(post.title);
  const [body, setBody] = useState(post.body);
  const [tag, setTag] = useState(post.tag);
  const [tagF, setTagF] = useState(false);
  const [scope, setScope] = useState<PostScope>(post.scope);
  const [slug, setSlug] = useState(post.slug);
  const [status, setStatus] = useState(post.status);
  const [stage, setStage] = useState<0 | 1 | 2 | 3>(0); // 0 closed · 1 form · 2 ink · 3 done
  const [save, setSave] = useState<"saved" | "dirty" | "saving" | "failed">("saved");
  const [note, setNote] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const lastSaved = useRef({ title: post.title, body: post.body });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const patch = useCallback(async (data: Record<string, unknown>) => {
    const res = await fetch(`/api/posts/${post.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error ?? String(res.status));
    }
    return (await res.json()) as { post: Post };
  }, [post.id]);

  /* ---------- autosave title/body, 900ms after the last keystroke ---------- */
  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (title === lastSaved.current.title && body === lastSaved.current.body) return;
    setSave("saving");
    try {
      await patch({ title, body });
      lastSaved.current = { title, body };
      setSave("saved");
    } catch {
      setSave("failed");
    }
  }, [title, body, patch]);

  useEffect(() => {
    if (title === lastSaved.current.title && body === lastSaved.current.body) return;
    setSave("dirty");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 900);
    return () => clearTimeout(timer.current);
  }, [title, body, flush]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (title !== lastSaved.current.title || body !== lastSaved.current.body) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [title, body]);

  /* ---------- publish panel ---------- */
  const openPanel = () => {
    if (stage !== 0) return;
    if (status === "draft" && /^d-[0-9a-f]{8}$/.test(slug)) setSlug(slugify(title));
    setStage(1);
    setNote("");
  };
  const closePanel = () => {
    setStage(0);
    setConfirmDel(false);
    setNote("");
  };
  const publish = async () => {
    if (stage !== 1) return;
    const s = slug.trim().toLowerCase();
    if (!/^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/.test(s)) {
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
      return;
    }
    try {
      await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      lastSaved.current = { title, body }; // silence the unload warning
      router.push("/write");
    } catch {
      setNote("잠시 뒤에 다시 시도해 주세요");
    }
  };

  const keyRef = useRef((e: KeyboardEvent) => void e);
  useEffect(() => {
    keyRef.current = (e: KeyboardEvent) => {
      if (e.key === "Escape" && stage === 1) closePanel();
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        void flush();
      }
    };
  });
  useEffect(() => {
    const k = (e: KeyboardEvent) => keyRef.current(e);
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, []);

  const chars = body.replace(/\s/g, "").length;
  const savedLabel = save === "saving" ? "저장 중" : save === "dirty" ? "쓰는 중" : save === "failed" ? "저장 실패" : status === "published" ? "발행됨" : "저장됨";
  const open = stage >= 1;

  return (
    <div className="page editor-page">
      <Rail>
        <div className="side-sub" style={{ marginTop: 0, letterSpacing: ".1em" }}>
          초안 {drafts.length}
        </div>
        <div className="drafts">
          {drafts.map((d) => (
            <Link key={d.id} href={`/write/edit/${d.id}`} className={`draft${d.id === post.id ? " active" : ""}`}>
              <span className="draft-title">{(d.id === post.id ? title : d.title) || "제목 없음"}</span>
              <span className="draft-when">{d.id === post.id ? "지금" : ago(d.updatedAt)}</span>
            </Link>
          ))}
          {status === "published" && (
            <Link href={`/write/${slug}`} className="draft">
              <span className="draft-title">발행된 글 보기 ↗</span>
            </Link>
          )}
        </div>
      </Rail>

      <div className="editor-status">
        {savedLabel}
        <br />
        {chars.toLocaleString()}자
      </div>

      <div className="editor">
        <input className="editor-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" spellCheck={false} onKeyDown={(e) => e.key === "Enter" && bodyRef.current?.focus()} />
        <textarea ref={bodyRef} className="editor-body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="쓰기 시작하세요" spellCheck={false} />

        {/* publish panel: unfolds beneath the text */}
        <div className="pub" style={{ maxHeight: stage === 0 ? 0 : stage === 3 ? 110 : 360, opacity: open ? 1 : 0, filter: stage === 2 ? "blur(2px)" : "blur(0)" }} inert={!open}>
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
                  <span className="pub-slug">
                    /write/
                    <input value={slug} onChange={(e) => setSlug(e.target.value)} spellCheck={false} style={{ width: Math.max(6, slug.length) + "ch" }} />
                  </span>
                </div>
                <div className="pub-foot">
                  <span style={{ display: "flex", gap: 16 }}>
                    <span className="pv-esc" onClick={closePanel}>
                      Esc 로 닫기
                    </span>
                    <span className="pv-esc" onClick={() => void remove()} style={{ color: confirmDel ? INK : undefined }}>
                      {confirmDel ? "정말 지우기" : "지우기"}
                    </span>
                    {status === "published" && (
                      <span className="pv-esc" onClick={() => void unpublish()}>
                        초안으로
                      </span>
                    )}
                    {note && <span className="pv-esc" style={{ color: INK }}>{note}</span>}
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
                <Link href={`/write/${slug}`} className="pub-link">
                  /write/{slug} ↗
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="editor-bar">
          <span className="pv-esc" style={{ cursor: "default" }}>
            {tag.trim() ? `태그 ${tag.trim()}` : "태그 없음"}
            {status === "published" ? ` · 발행됨` : ""}
          </span>
          <span className="pub-btn" style={{ color: open ? DIM : INK }} onClick={openPanel}>
            발행
          </span>
        </div>
      </div>
    </div>
  );
}
