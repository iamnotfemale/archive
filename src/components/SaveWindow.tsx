"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Item } from "@/lib/types";
import { domainOf, normalizeUrl } from "@/lib/url";
import TagSuggest from "./TagSuggest";

type Meta = { url: string; title: string; domain: string };

export default function SaveWindow() {
  const sp = useSearchParams();
  const paramUrl = normalizeUrl(sp.get("url") ?? "") ?? "";
  const hintTitle = sp.get("title") ?? "";

  const [url, setUrl] = useState(paramUrl);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [memo, setMemo] = useState("");
  const [tag, setTag] = useState("");
  const [tagF, setTagF] = useState(false);
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const [note, setNote] = useState("");
  const memoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/tags")
      .then((r) => r.json())
      .then((t: string[]) => setTags(t))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!url) return;
    let alive = true;
    fetch(`/api/meta?url=${encodeURIComponent(url)}&title=${encodeURIComponent(hintTitle)}`)
      .then((r) => r.json())
      .then((m: Meta) => alive && setMeta({ ...m, url }))
      .catch(() => alive && setMeta({ url, title: hintTitle || domainOf(url), domain: domainOf(url) }));
    return () => {
      alive = false;
    };
  }, [url, hintTitle]);
  // meta is only "ready" when it belongs to the current url (no reset-in-effect needed)
  const ready = meta && meta.url === url ? meta : null;

  const close = () => {
    window.close();
    setTimeout(() => window.location.replace("/"), 400);
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  });

  const save = async () => {
    if (!url || stage) return;
    setStage(1);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, memo, tag, title: ready?.title ?? hintTitle }),
      });
      if (res.status === 401) {
        setStage(0);
        setNote("열쇠가 없습니다. 아카이브에서 먼저 열쇠를 넣어 주세요.");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { item: Item; existing: boolean };
      if (data.existing) setNote("이미 남긴 링크입니다");
      setTimeout(() => setStage(2), 320);
      setTimeout(close, 640);
    } catch {
      setStage(0);
      setNote("잠시 뒤에 다시 시도해 주세요");
    }
  };

  const onEnter = (e: React.KeyboardEvent) => e.key === "Enter" && void save();

  return (
    <div className="save-page">
      <div
        className="save"
        style={{
          filter: stage === 1 ? "blur(2px)" : "blur(0)",
          opacity: stage === 2 ? 0 : 1,
          transform: stage === 2 ? "translateY(-4px)" : "translateY(0)",
        }}
      >
        {!paramUrl && (
          <div className="save-field" style={{ marginBottom: 32 }}>
            <input
              autoFocus
              placeholder="링크를 붙여넣으세요"
              spellCheck={false}
              onChange={(e) => {
                const n = normalizeUrl(e.target.value);
                if (n) setUrl(n);
              }}
              onKeyDown={(e) => e.key === "Enter" && memoRef.current?.focus()}
            />
          </div>
        )}

        <div className={`save-title${ready ? "" : " loading"}`}>{ready?.title || hintTitle || (url ? domainOf(url) : "")}</div>
        <div className="save-domain">{url ? domainOf(url) : " "}</div>

        <div className="save-field memo">
          <input ref={memoRef} autoFocus={!!paramUrl} value={memo} onChange={(e) => setMemo(e.target.value)} onKeyDown={onEnter} placeholder="왜 남기나요" />
        </div>
        <div className="save-field tag">
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            onFocus={() => setTagF(true)}
            onBlur={() => setTagF(false)}
            onKeyDown={onEnter}
            placeholder="태그"
          />
        </div>
        <TagSuggest tags={tags} input={tag} open={tagF} onPick={setTag} />

        <div className="save-foot">
          <span className="save-esc">{note || "Esc 로 닫기"}</span>
          <span className={`save-btn${url ? "" : " dim"}`} onClick={() => void save()}>
            남기기
          </span>
        </div>
      </div>
    </div>
  );
}
