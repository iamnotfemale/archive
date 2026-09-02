"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Item } from "@/lib/types";
import { extractUrls } from "@/lib/url";
import { dayLabel, monthKey, monthLabel, shortUrl } from "@/lib/format";
import { distinctTags } from "@/lib/tags";
import TagSuggest from "./TagSuggest";

const ALL = "전체";
const UNSORTED = "__unsorted";
const ROW_MAX = 60;
const INK = "#1F1D1A";
const INK_45 = "rgba(31,29,26,.45)";

type Props = { initialItems: Item[]; locked: boolean; dbError?: string | null };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  if (res.status === 401) throw new Error("locked");
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `http ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export default function Archive({ initialItems, locked, dbError = null }: Props) {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState(ALL);
  const [isLocked, setIsLocked] = useState(locked);
  const [notice, setNotice] = useState("");

  // add (centered overlay)
  const [addOpen, setAddOpen] = useState(false);
  const [addUrl, setAddUrl] = useState("");
  const [addMemo, setAddMemo] = useState("");
  const [addTag, setAddTag] = useState("");
  const [addTagF, setAddTagF] = useState(false);
  const [addBusy, setAddBusy] = useState(false);

  // search (centered overlay; the query stays applied after Enter)
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [slashHover, setSlashHover] = useState(false);

  // hover preview + edit
  const [hover, setHover] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [pvTop, setPvTop] = useState(200);
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMemo, setEditMemo] = useState("");
  const [editTag, setEditTag] = useState("");
  const [editTagF, setEditTagF] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  // phone layout: no hover, the preview becomes a bottom sheet opened by tapping a row
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const pageRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const urlInput = useRef<HTMLInputElement>(null);
  const memoInput = useRef<HTMLInputElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const [initialIds] = useState(() => new Set(initialItems.map((i) => i.id)));
  const editingRef = useRef(editing);
  useEffect(() => {
    editingRef.current = editing;
  }, [editing]);

  const tags = useMemo(() => distinctTags(items), [items]);
  const unsorted = useMemo(() => items.filter((i) => !i.tag).length, [items]);

  const months = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const it of items) {
      const k = monthKey(it.createdAt);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(it);
    }
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, rows]) => ({ key, label: monthLabel(key), rows: rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) }));
  }, [items]);

  const ql = q.trim().toLowerCase();
  const visible = (it: Item) => {
    if (filter === UNSORTED) {
      if (it.tag) return false;
    } else if (filter !== ALL && it.tag !== filter) return false;
    if (!ql) return true;
    return [it.title, it.memo, it.domain, it.tag, it.url].some((s) => s.toLowerCase().includes(ql));
  };
  const matchCount = ql ? items.filter(visible).length : null;

  const hv = hover ? items.find((i) => i.id === hover) ?? null : null;
  const isEditingHv = !!hv && editing === hv.id;
  const pvShown = !!hv && (!leaving || isEditingHv);
  const overlayOpen = addOpen; // only "남기기" uses the centered veil; search stays inline so filtering is visible

  /* ---------- transient side note ---------- */
  const say = (text: string, ms = 2400) => {
    clearTimeout(noticeTimer.current);
    setNotice(text);
    if (ms > 0) noticeTimer.current = setTimeout(() => setNotice(""), ms);
  };
  const fail = (e: unknown) => {
    const code = e instanceof Error ? e.message : "";
    if (code === "locked") {
      setIsLocked(true);
      say("열쇠가 없어 남길 수 없습니다", 3200);
    } else if (code === "no_database") say("데이터베이스가 아직 연결되지 않았습니다", 5000);
    else if (code === "db_failed") say("데이터베이스에 닿지 못했습니다", 5000);
    else say("잠시 뒤에 다시 시도해 주세요", 3200);
  };

  /* ---------- create ---------- */
  const create = async (url: string, memo: string, tag: string) => {
    const res = await api<{ item: Item; existing: boolean }>("/api/items", {
      method: "POST",
      body: JSON.stringify({ url, memo, tag }),
    });
    if (!res.existing) setItems((prev) => [res.item, ...prev]);
    return res;
  };

  const submitAdd = async () => {
    const url = addUrl.trim();
    if (!url || addBusy) return;
    setAddBusy(true);
    try {
      const res = await create(url, addMemo, addTag);
      if (res.existing) say("이미 남긴 링크입니다");
      setTimeout(() => {
        setAddOpen(false);
        setAddUrl("");
        setAddMemo("");
        setAddTag("");
        setAddBusy(false);
      }, 320);
    } catch (e) {
      setAddBusy(false);
      fail(e);
    }
  };

  const bulk = async (urls: string[]) => {
    let added = 0;
    for (let i = 0; i < urls.length; i++) {
      say(`${i + 1} / ${urls.length} 남기는 중`, 0);
      try {
        const r = await create(urls[i], "", "");
        if (!r.existing) added++;
      } catch (e) {
        fail(e);
        return;
      }
    }
    say(`${added}개를 남겼습니다`);
  };

  /* ---------- overlays ---------- */
  const openAdd = (url = "") => {
    setHover(null);
    setSearchOpen(false);
    setAddOpen(true);
    if (url) setAddUrl(url);
    setTimeout(() => (url ? memoInput : urlInput).current?.focus(), 60);
  };
  const closeAdd = () => {
    setAddOpen(false);
    setAddUrl("");
    setAddMemo("");
    setAddTag("");
  };
  const openSearch = () => {
    setHover(null);
    setAddOpen(false);
    setSearchOpen(true);
    setTimeout(() => {
      searchInput.current?.focus();
      searchInput.current?.select();
    }, 60);
  };
  const applySearch = () => searchInput.current?.blur(); // Enter: keep the query, release the keyboard
  const clearSearch = () => {
    setSearchOpen(false);
    setQ("");
  };

  /* ---------- hover ---------- */
  const enterRow = (it: Item) => {
    clearTimeout(leaveTimer.current);
    if (editing && editing !== it.id) return;
    const el = rowRefs.current.get(it.id);
    const page = pageRef.current;
    // thumbnail top aligns with the row's text; never overlap the corner glyphs
    if (el && page) setPvTop(Math.max(96, el.getBoundingClientRect().top - page.getBoundingClientRect().top + 13));
    setHover(it.id);
    setLeaving(false);
  };
  const scheduleLeave = () => {
    clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => {
      if (!editingRef.current) setLeaving(true);
    }, 160);
  };
  const cancelLeave = () => clearTimeout(leaveTimer.current);
  const openSheet = (it: Item) => {
    clearTimeout(leaveTimer.current);
    setEditing(null);
    setConfirmDel(false);
    setHover(it.id);
    setLeaving(false);
  };
  const closeSheet = () => {
    setHover(null);
    setEditing(null);
    setConfirmDel(false);
  };

  /* ---------- edit ---------- */
  const startEdit = () => {
    if (!hv) return;
    setEditing(hv.id);
    setEditTitle(hv.title);
    setEditMemo(hv.memo);
    setEditTag(hv.tag);
    setConfirmDel(false);
  };
  const cancelEdit = () => {
    setEditing(null);
    setConfirmDel(false);
  };
  const saveEdit = async () => {
    const id = editing;
    if (!id) return;
    try {
      const title = editTitle.trim();
      const res = await api<{ item: Item }>(`/api/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ memo: editMemo, tag: editTag, ...(title ? { title } : {}) }), // empty title keeps the old one
      });
      setItems((prev) => prev.map((i) => (i.id === id ? res.item : i)));
      setEditing(null);
      setConfirmDel(false);
    } catch (e) {
      fail(e);
    }
  };
  const removeItem = async () => {
    const id = editing;
    if (!id) return;
    if (!confirmDel) {
      setConfirmDel(true);
      return;
    }
    try {
      await api(`/api/items/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== id));
      setEditing(null);
      setHover(null);
      setConfirmDel(false);
    } catch (e) {
      fail(e);
    }
  };

  /* ---------- global paste & keys (handlers kept in refs so listeners bind once) ---------- */
  const onPaste = (e: ClipboardEvent) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    const urls = extractUrls(e.clipboardData?.getData("text") ?? "");
    if (!urls.length) return;
    e.preventDefault();
    if (urls.length === 1) openAdd(urls[0]);
    else void bulk(urls);
  };
  const onKey = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    const inInput = !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA");
    if (e.key === "Escape") {
      if (editing) cancelEdit();
      else if (mobile && hover) closeSheet();
      else if (addOpen) closeAdd();
      else if (searchOpen) clearSearch();
      t?.blur?.();
      return;
    }
    if (e.key === "/" && !inInput) {
      e.preventDefault();
      if (searchOpen) searchInput.current?.focus();
      else openSearch();
    }
  };
  const pasteRef = useRef(onPaste);
  const keyRef = useRef(onKey);
  useEffect(() => {
    pasteRef.current = onPaste;
    keyRef.current = onKey;
  });
  useEffect(() => {
    const p = (e: ClipboardEvent) => pasteRef.current(e);
    const k = (e: KeyboardEvent) => keyRef.current(e);
    document.addEventListener("paste", p);
    document.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("paste", p);
      document.removeEventListener("keydown", k);
    };
  }, []);

  /* ---------- derived labels ---------- */
  const empty = items.length === 0;
  const sideNote = empty ? "아직 남긴 것 없음" : unsorted > 0 ? `정리되지 않은 것 ${unsorted}` : `남긴 것 ${items.length}`;
  const slashTransform = searchOpen ? "rotate(24deg)" : slashHover ? "rotate(10deg)" : "none";

  return (
    <div className="page" ref={pageRef}>
      {/* left margin */}
      <div className="side">
        <div className="wordmark">archive</div>
        <div
          className={`side-note${unsorted > 0 && !empty ? " clickable" : ""}${filter === UNSORTED ? " active" : ""}`}
          onClick={() => unsorted > 0 && setFilter((f) => (f === UNSORTED ? ALL : UNSORTED))}
        >
          {sideNote}
        </div>
        {isLocked && <div className="side-sub">열쇠가 없어 읽기만 됩니다</div>}
        {dbError === "no_database" && <div className="side-sub">데이터베이스가 아직 연결되지 않았습니다 · Vercel Storage 에서 Neon 을 연결하세요</div>}
        {dbError === "db_failed" && <div className="side-sub">데이터베이스에 닿지 못했습니다</div>}
        {notice && (
          <div className="side-sub" style={{ animation: "rise .3s ease-out both" }}>
            {notice}
          </div>
        )}
        {!empty && (
          <div className="tags">
            {[ALL, ...tags].map((name, i) => (
              <span
                key={name}
                className={`tag${filter === name ? " active" : ""}`}
                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                onClick={() => setFilter(name)}
              >
                {name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* corners */}
      {!isLocked && (
        <div
          className="corner plus"
          title="남기기"
          style={{ transform: addOpen ? "rotate(45deg)" : "none", color: addOpen || empty ? INK_45 : INK }}
          onClick={() => (addOpen ? closeAdd() : openAdd())}
        >
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
        {/* search: inline at the top so the list is seen filtering as you type */}
        <div className="panel" inert={!searchOpen} style={{ maxHeight: searchOpen ? 120 : 0, opacity: searchOpen ? 1 : 0 }}>
          <div className="grid">
            <div />
            <div className="field lg" style={{ marginBottom: 36 }}>
              <input
                ref={searchInput}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applySearch()}
                placeholder="찾을 말"
                spellCheck={false}
              />
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
                {m.rows.map((it, i) => {
                  const vis = visible(it);
                  const on = hover === it.id && (!leaving || isEditingHv);
                  const delay = initialIds.has(it.id) ? Math.min((mi * 4 + i) * 45, 1000) : 0;
                  return (
                    <div key={it.id} className="row-wrap" style={{ opacity: vis ? 1 : 0, maxHeight: vis ? ROW_MAX : 0 }}>
                      <div
                        ref={(el) => {
                          if (el) rowRefs.current.set(it.id, el);
                          else rowRefs.current.delete(it.id);
                        }}
                        className={`row${on ? " on" : ""}`}
                        style={{ animationDelay: `${delay}ms` }}
                        onMouseEnter={() => !mobile && enterRow(it)}
                        onMouseLeave={() => !mobile && scheduleLeave()}
                        onClick={() => mobile && openSheet(it)}
                      >
                        <span className="row-line" />
                        <span
                          className="row-title"
                          style={{ cursor: "pointer" }}
                          onClick={(e) => {
                            if (mobile) return;
                            e.stopPropagation();
                            window.open(it.url, "_blank", "noopener");
                          }}
                        >
                          <Highlight text={it.title} q={ql} />
                        </span>
                        <span className="row-meta domain">{it.domain}</span>
                        {it.tag && <span className="row-meta tagname">{it.tag}</span>}
                        <span className="row-meta date">{dayLabel(it.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div />
            </div>
          );
        })}
      </div>

      {/* empty state */}
      {empty && (
        <div className="empty-state">
          <div className="empty-state-h">아직 아무것도 남기지 않았습니다.</div>
        </div>
      )}

      {/* hover preview in the right margin */}
      {mobile && <div className={`pv-backdrop${pvShown ? " open" : ""}`} onClick={closeSheet} />}
      <div
        className="preview"
        onMouseEnter={mobile ? undefined : cancelLeave}
        onMouseLeave={mobile ? undefined : scheduleLeave}
        style={
          mobile
            ? {
                top: "auto",
                opacity: pvShown ? 1 : 0,
                transform: pvShown ? "translateY(0)" : "translateY(24px)",
                transition: "opacity .3s ease-out, transform .35s ease-out",
                pointerEvents: pvShown ? "auto" : "none",
              }
            : {
                top: pvTop,
                opacity: pvShown ? 1 : 0,
                transform: pvShown ? "translateY(0)" : "translateY(4px)",
                transition: pvShown ? "opacity .35s ease-out, transform .35s ease-out" : "opacity .18s ease-out, transform .18s ease-out",
                pointerEvents: pvShown ? "auto" : "none",
              }
        }
      >
        {hv && (
          <>
            <div className="pv-head">
              <span className="pv-title">{hv.title}</span>
              <span className="pv-close" onClick={closeSheet}>
                닫기
              </span>
            </div>
            <a href={hv.url} target="_blank" rel="noreferrer" style={{ display: "block" }}>
              <div className="thumb">
                {hv.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={hv.image} alt="" loading="lazy" referrerPolicy="no-referrer" />
                ) : (
                  <span>{hv.domain}</span>
                )}
              </div>
              <div className="pv-url">{shortUrl(hv.url)} ↗</div>
            </a>

            {!isEditingHv && (
              <>
                <div className={`pv-memo${hv.memo ? "" : " empty"}`}>{hv.memo || (hv.description ? hv.description.slice(0, 90) : "메모 없음")}</div>
                <div className="pv-foot">
                  <span className="pv-tag">{hv.tag || "태그 없음"}</span>
                  {!isLocked && (
                    <span className="pv-btn" onClick={startEdit}>
                      수정
                    </span>
                  )}
                </div>
              </>
            )}

            {isEditingHv && (
              <>
                <div className="pv-field title">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void saveEdit()}
                    placeholder="제목"
                  />
                </div>
                <div className="pv-field memo">
                  <input
                    autoFocus
                    value={editMemo}
                    onChange={(e) => setEditMemo(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void saveEdit()}
                    placeholder="왜 남기나요"
                  />
                </div>
                <div className="pv-field tag">
                  <input
                    value={editTag}
                    onChange={(e) => setEditTag(e.target.value)}
                    onFocus={() => setEditTagF(true)}
                    onBlur={() => setEditTagF(false)}
                    onKeyDown={(e) => e.key === "Enter" && void saveEdit()}
                    placeholder="태그"
                  />
                </div>
                <TagSuggest tags={tags} input={editTag} open={editTagF} onPick={setEditTag} gap={14} />
                <div className="pv-foot" style={{ marginTop: 14 }}>
                  <span style={{ display: "flex", gap: 14 }}>
                    <span className="pv-esc" onClick={cancelEdit}>
                      Esc 로 취소
                    </span>
                    <span className="pv-esc" onClick={() => void removeItem()} style={{ color: confirmDel ? INK : undefined }}>
                      {confirmDel ? "정말 지우기" : "지우기"}
                    </span>
                  </span>
                  <span className="pv-save" onClick={() => void saveEdit()}>
                    저장
                  </span>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* centered veil: add / search */}
      <div
        className={`veil${overlayOpen ? " open" : ""}`}
        inert={!overlayOpen}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) closeAdd();
        }}
      >
        <div className="sheet" style={{ filter: addBusy ? "blur(2px)" : "blur(0)" }}>
          {addOpen && (
            <>
              <div className="field lg">
                <input
                  ref={urlInput}
                  value={addUrl}
                  onChange={(e) => setAddUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void submitAdd()}
                  placeholder="링크를 붙여넣으세요"
                  spellCheck={false}
                />
                <span className={`action${addUrl.trim() ? "" : " dim"}`} onClick={() => void submitAdd()}>
                  남기기
                </span>
              </div>
              <div className="field md">
                <input
                  ref={memoInput}
                  value={addMemo}
                  onChange={(e) => setAddMemo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void submitAdd()}
                  placeholder="왜 남기나요"
                />
              </div>
              <div className="field sm">
                <input
                  value={addTag}
                  onChange={(e) => setAddTag(e.target.value)}
                  onFocus={() => setAddTagF(true)}
                  onBlur={() => setAddTagF(false)}
                  onKeyDown={(e) => e.key === "Enter" && void submitAdd()}
                  placeholder="태그"
                />
              </div>
              <TagSuggest tags={tags} input={addTag} open={addTagF} onPick={setAddTag} />
              <div className="sheet-esc">Esc 로 닫기</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q);
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}
