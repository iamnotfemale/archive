"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Work } from "@/lib/types";
import { slugify } from "@/lib/markdown";

type Props = {
  work: Work;
  onChange: (work: Work) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
};

const INK = "#1F1D1A";
const DIM = "rgba(31,29,26,.42)";
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;
const FIELDS = ["title", "note", "year", "body"] as const; // note = 부제목
type Field = (typeof FIELDS)[number];
type Draft = Pick<Work, Field>;

/** 작업 편집기. 목록 위 베일 안에서 뜬다. 제목 · 부제목 · 주소 · 연도 · 본문, 아래 "발행" 한 번. */
export default function WorkEditorSheet({ work, onChange, onClose, onDelete }: Props) {
  const [d, setD] = useState<Draft>({ title: work.title, note: work.note, year: work.year, body: work.body });
  const [slug, setSlug] = useState(/^d-[0-9a-f]{8}$/.test(work.slug) ? slugify(work.title) : work.slug);
  const [status, setStatus] = useState(work.status);
  const [busy, setBusy] = useState<"" | "publish" | "unpublish">("");
  const [ink, setInk] = useState(false);
  const [save, setSave] = useState<"saved" | "dirty" | "saving" | "failed">("saved");
  const [note, setNote] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const [uploading, setUploading] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const subtitleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const slugTouched = useRef(!/^d-[0-9a-f]{8}$/.test(work.slug));
  const [savedSlug, setSavedSlug] = useState(work.slug);
  const lastSaved = useRef<Draft>({ ...d });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setTimeout(() => (work.title ? bodyRef : titleRef).current?.focus(), 80);
  }, [work.title]);

  const set = (k: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setD((p) => ({ ...p, [k]: e.target.value }));

  const patch = useCallback(
    async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/works/${work.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? String(res.status));
      }
      const json = (await res.json()) as { work: Work };
      onChange(json.work);
      return json.work;
    },
    [work.id, onChange],
  );

  const explain = (e: unknown) => {
    const code = e instanceof Error ? e.message : "";
    return code === "slug_taken" ? "이미 쓰는 주소입니다" : code === "invalid_slug" ? "주소는 영문 소문자·숫자·하이픈만" : code === "locked" ? "열쇠가 없습니다 · /key 로 다시 들어오세요" : code === "no_database" ? "데이터베이스가 연결되지 않았습니다" : code === "no_blob" ? "이미지 저장소가 아직 없습니다" : code === "too_large" ? "12MB 이하 이미지만" : code === "bad_type" ? "jpg · png · webp · gif · avif · svg 만" : "저장하지 못했습니다 · 잠시 뒤 다시";
  };

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

  const onTitle = (v: string) => {
    setD((p) => ({ ...p, title: v }));
    if (!slugTouched.current && status === "draft" && /[a-z]/i.test(v)) setSlug(slugify(v));
  };

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

  /* ---------- images ---------- */
  const insertImage = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? String(res.status));
      const ta = bodyRef.current;
      const pos = ta ? ta.selectionStart : d.body.length;
      const before = d.body.slice(0, pos);
      const after = d.body.slice(pos);
      const lead = before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
      const snippet = `${lead}![](${json.url})\n\n`;
      setD((p) => ({ ...p, body: before + snippet + after }));
      setTimeout(() => {
        if (!ta) return;
        const at = before.length + lead.length + 2;
        ta.focus();
        ta.setSelectionRange(at, at);
      }, 0);
    } catch (e) {
      setNote(explain(e));
      setTimeout(() => setNote(""), 5000);
    } finally {
      setUploading(false);
    }
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
      const res = await fetch(`/api/works/${work.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(String(res.status));
      onDelete(work.id);
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
      <input ref={subtitleRef} className="editor-subtitle" value={d.note} onChange={set("note")} placeholder="부제목" spellCheck={false} onKeyDown={(e) => e.key === "Enter" && bodyRef.current?.focus()} />
      <div className="editor-meta slug">
        <span>/portfolio/</span>
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
        <span style={{ flex: 1 }} />
        <input value={d.year} onChange={set("year")} placeholder="연도" spellCheck={false} style={{ width: "5ch", flex: "none", textAlign: "right" }} />
      </div>
      <textarea
        ref={bodyRef}
        className="editor-body"
        value={d.body}
        onChange={set("body")}
        placeholder="본문"
        spellCheck={false}
        onPaste={(e) => {
          const f = [...(e.clipboardData?.files ?? [])].find((x) => x.type.startsWith("image/"));
          if (f) {
            e.preventDefault();
            void insertImage(f);
          }
        }}
      />

      <div className="editor-bar">
        <span className="bar-left">
          <span className="pv-esc" style={{ cursor: "default", color: status === "published" ? INK : undefined }}>
            {status === "published" ? "발행됨" : "초안"}
          </span>
          {status === "published" && (
            <a href={`/portfolio/${savedSlug}`} className="pv-esc" target="_blank" rel="noreferrer">
              보기 ↗
            </a>
          )}
          {status === "published" && (
            <span className="pv-esc" onClick={() => void unpublish()}>
              {busy === "unpublish" ? "되돌리는 중" : "초안으로"}
            </span>
          )}
          <span className="pv-esc" onClick={() => fileRef.current?.click()}>
            {uploading ? "올리는 중" : "이미지"}
          </span>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && void insertImage(e.target.files[0])} />
          <span className="pv-esc" onClick={() => void remove()} style={{ color: confirmDel ? INK : undefined }}>
            {confirmDel ? "정말 지우기" : "지우기"}
          </span>
          {note && <span className="pv-esc editor-note-bar">{note}</span>}
        </span>
        <span className="bar-right">
          <span className="pub-btn" style={{ color: busy === "publish" ? DIM : INK }} onClick={() => void publish()}>
            {busy === "publish" ? "발행 중" : status === "published" ? "다시 발행" : "발행"}
          </span>
        </span>
      </div>
    </div>
  );
}
