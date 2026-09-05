"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Work } from "@/lib/types";
import { slugify } from "@/lib/markdown";
import Rail from "./Rail";

type Props = { work: Work; all: Work[] };

const INK = "#1F1D1A";
const DIM = "rgba(31,29,26,.42)";
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;
const FIELDS = ["title", "note", "year", "body"] as const; // note = 부제목
type Field = (typeof FIELDS)[number];
type Draft = Pick<Work, Field>;

export default function WorkEditor({ work, all }: Props) {
  const router = useRouter();
  const [d, setD] = useState<Draft>({ title: work.title, note: work.note, year: work.year, body: work.body });
  const [slug, setSlug] = useState(/^d-[0-9a-f]{8}$/.test(work.slug) ? slugify(work.title) : work.slug);
  const [status, setStatus] = useState(work.status);
  const [stage, setStage] = useState<0 | 1 | 2 | 3>(0);
  const [save, setSave] = useState<"saved" | "dirty" | "saving" | "failed">("saved");
  const [note, setNote] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const subtitleRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const slugTouched = useRef(!/^d-[0-9a-f]{8}$/.test(work.slug));
  const lastSaved = useRef<Draft>({ ...d });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const set = (k: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setD((p) => ({ ...p, [k]: e.target.value }));
  const changed = (x: Draft) => FIELDS.some((k) => x[k] !== lastSaved.current[k]);

  const patch = useCallback(
    async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/works/${work.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? String(res.status));
      }
      return (await res.json()) as { work: Work };
    },
    [work.id],
  );

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (!FIELDS.some((k) => d[k] !== lastSaved.current[k])) return;
    setSave("saving");
    try {
      await patch(d);
      lastSaved.current = { ...d };
      setSave("saved");
    } catch {
      setSave("failed");
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

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (changed(d)) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  });

  const saveSlug = async () => {
    const s = slug.trim().toLowerCase();
    if (!s || s === work.slug) return;
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

  /* ---------- images ---------- */
  const uploadFail = (e: unknown) => {
    const code = e instanceof Error ? e.message : "";
    setNote(code === "no_blob" ? "이미지 저장소가 아직 없습니다" : code === "too_large" ? "12MB 이하 이미지만" : code === "bad_type" ? "jpg · png · webp · gif · avif · svg 만" : "이미지를 올리지 못했습니다");
    setTimeout(() => setNote(""), 5000);
  };
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
      uploadFail(e);
    } finally {
      setUploading(false);
    }
  };

  /* ---------- publish ---------- */
  const openPanel = () => {
    if (stage !== 0) return;
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
    if (!SLUG_RE.test(s)) {
      setNote("주소는 영문 소문자·숫자·하이픈만");
      return;
    }
    setStage(2);
    try {
      await flush();
      await patch({ slug: s, status: "published" });
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
      await fetch(`/api/works/${work.id}`, { method: "DELETE" });
      lastSaved.current = { ...d };
      document.querySelector(".page")?.classList.add("leaving");
      setTimeout(() => router.push("/portfolio"), 260);
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

  const chars = d.body.replace(/\s/g, "").length;
  const savedLabel = save === "saving" ? "저장 중" : save === "dirty" ? "쓰는 중" : save === "failed" ? "저장 실패" : status === "published" ? "발행됨" : "저장됨";
  const open = stage >= 1;

  return (
    <div className="page editor-page">
      <Rail>
        <div className="side-sub" style={{ marginTop: 0, letterSpacing: ".1em" }}>
          작업 {all.length}
        </div>
        <div className="drafts">
          {all.map((w) => (
            <Link key={w.id} href={`/portfolio/edit/${w.id}`} className={`draft${w.id === work.id ? " active" : ""}`}>
              <span className="draft-title">{(w.id === work.id ? d.title : w.title) || "제목 없음"}</span>
              <span className="draft-when">
                {w.id === work.id ? d.year : w.year}
                {(w.id === work.id ? status : w.status) === "draft" ? " · 초안" : ""}
              </span>
            </Link>
          ))}
          {status === "published" && (
            <Link href={`/portfolio/${slug}`} className="draft">
              <span className="draft-title">발행된 작업 보기 ↗</span>
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
        <input className="editor-title" value={d.title} onChange={(e) => onTitle(e.target.value)} placeholder="제목" spellCheck={false} onKeyDown={(e) => e.key === "Enter" && subtitleRef.current?.focus()} />
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
          {note && <span className="editor-note">{note}</span>}
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

        <div className="pub" style={{ maxHeight: stage === 0 ? 0 : stage === 3 ? 110 : 200, opacity: open ? 1 : 0, filter: stage === 2 ? "blur(2px)" : "blur(0)" }} inert={!open}>
          <div className="pub-inner">
            {(stage === 1 || stage === 2) && (
              <div className="pub-foot" style={{ marginTop: 0 }}>
                <span style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
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
                  <span className="pub-slug">/portfolio/{slug}</span>
                </span>
                <span className="pub-go" onClick={() => void publish()}>
                  {status === "published" ? "다시 발행하기" : "발행하기"}
                </span>
              </div>
            )}
            {stage === 3 && (
              <div className="pub-done">
                <span>발행되었습니다.</span>
                <Link href={`/portfolio/${slug}`} className="pub-link">
                  /portfolio/{slug} ↗
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="editor-bar">
          <span style={{ display: "flex", gap: 16, alignItems: "baseline", flexWrap: "wrap" }}>
            <span className="pv-esc" onClick={() => fileRef.current?.click()}>
              {uploading ? "올리는 중" : "이미지"}
            </span>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && void insertImage(e.target.files[0])} />
            <span className="pv-esc" style={{ cursor: "default" }}>
              {status === "published" ? "발행됨" : "초안"}
            </span>
          </span>
          <span className="pub-btn" style={{ color: open ? DIM : INK }} onClick={openPanel}>
            발행
          </span>
        </div>
      </div>
    </div>
  );
}
