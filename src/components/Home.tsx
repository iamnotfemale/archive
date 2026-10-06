"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Item } from "@/lib/types";
import { dayLabel, monthKey } from "@/lib/format";
import { distinctTags } from "@/lib/tags";
import { extractUrls } from "@/lib/url";
import { site } from "@/content/site";
import Dither from "./Dither";
import Fields from "./Fields";
import Footer from "./Footer";
import { Clock } from "./Nav";
import { AddDrawer, SearchOverlay, type DrawerState } from "./Overlays";

const pad = (n: number) => String(n + 1).padStart(2, "0");
const monthTitle = (k: string) => k.replace("-", " · ");

export default function Home({ items: initial, posts, writable, locked }: { items: Item[]; posts: number; writable: boolean; locked: boolean }) {
  const [items, setItems] = useState(initial);
  const [focus, setFocus] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [search, setSearch] = useState(false);
  const [note, setNote] = useState("");
  const card = useRef<HTMLDivElement>(null);
  const tags = useMemo(() => distinctTags(items), [items]);
  const shown = focus ? items.filter((i) => i.tag === focus) : items;
  const months = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const i of shown) {
      const k = monthKey(i.createdAt);
      (m.get(k) ?? m.set(k, []).get(k)!).push(i);
    }
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [shown]);

  const say = (t: string) => {
    setNote(t);
    setTimeout(() => setNote(""), 2600);
  };
  const upsert = (it: Item, existing: boolean) => {
    setItems((p) => (p.some((x) => x.id === it.id) ? p.map((x) => (x.id === it.id ? it : x)) : [it, ...p]));
    if (existing && drawer?.mode === "add") say("Already kept");
  };
  const bulk = async (urls: string[]) => {
    let n = 0;
    for (const u of urls) {
      const r = await fetch("/api/items", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: u }) });
      if (!r.ok) {
        say("Couldn't save");
        return;
      }
      const j = (await r.json()) as { item: Item; existing: boolean };
      upsert(j.item, j.existing);
      if (!j.existing) n++;
    }
    say(`${n} kept`);
  };

  useEffect(() => {
    const paste = (e: ClipboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (!writable || drawer || search || (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA"))) return;
      const urls = extractUrls(e.clipboardData?.getData("text") ?? "");
      if (!urls.length) return;
      e.preventDefault();
      if (urls.length === 1) setDrawer({ mode: "add", url: urls[0] });
      else void bulk(urls);
    };
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key === "/" && !drawer && !search && !(t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA"))) {
        e.preventDefault();
        setSearch(true);
      }
    };
    document.addEventListener("paste", paste);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("paste", paste);
      document.removeEventListener("keydown", key);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writable, drawer, search]);

  const tilt = (e: React.MouseEvent) => {
    const c = card.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    c.style.transform = Math.abs(x) < 1.2 && Math.abs(y) < 1.6 ? `perspective(900px) rotateX(${-y * 8}deg) rotateY(${x * 10}deg)` : "none";
  };
  const mail = site.contacts.find((c) => c.href.startsWith("mailto:"));
  let n = 0;

  return (
    <div id="top">
      <section className="hero" onMouseMove={tilt} onMouseLeave={() => card.current && (card.current.style.transform = "none")}>
        <div ref={card} className="bizcard">
          <div>
            <div className="name">{site.name}</div>
            <div className="mute" style={{ marginTop: 4 }}>
              Developer & student
              <br />
              Dept. of AI, Korea University
            </div>
          </div>
          <nav>
            <a href="#archive" className="on">
              <span>Archive</span>
              <span className="mute">{items.length}</span>
            </a>
            <Link href="/write">
              <span>Writing</span>
              <span className="mute">{posts}</span>
            </Link>
            <Link href="/portfolio">
              <span>Portfolio</span>
              <span className="mute">CV</span>
            </Link>
            <a href="#search" className="gap" onClick={(e) => (e.preventDefault(), setSearch(true))}>
              <span>Search</span>
              <span className="mute">/</span>
            </a>
            {writable && (
              <a href="#add" onClick={(e) => (e.preventDefault(), setDrawer({ mode: "add" }))}>
                <span>Keep a link</span>
                <span className="mute">+</span>
              </a>
            )}
          </nav>
          <div style={{ gridColumn: 1, gridRow: 2, alignSelf: "end" }}>
            <div className="sq" />
          </div>
          <div className="mute" style={{ gridColumn: 1, gridRow: 3 }}>
            <Clock />
          </div>
          {mail && (
            <a href={mail.href} style={{ gridColumn: 2, gridRow: 3, textAlign: "right" }}>
              {mail.value}
            </a>
          )}
        </div>
        <Dither shape="circle" className="hero-canvas" />
        <h1>
          A developer’s archive<span className="ac">.</span>
          <br />
          <span className="sub">Reads, builds, keeps.</span>
        </h1>
        <div className="hero-foot">
          <a href="#fields" className="btn-pill">
            Selected archive ↓
          </a>
          <span className="mute">
            {note || `${items.length} links${locked ? " · read-only" : ""}`}
          </span>
        </div>
      </section>

      <Fields items={items} tags={tags} focus={focus} onFocus={setFocus} />

      <section id="archive" className="wrap" style={{ paddingTop: 96 }}>
        <div className="g12 arch-head">
          <div className="c3" style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
            <span className="sec-no">01</span>
            <span className="sec-title">Archive</span>
          </div>
          <div className="c9">
            <span className="mute">Showing</span>
            <span className={focus ? "on" : ""}>{focus ?? "Everything"}</span>
            <span className="mute">
              {shown.length} / {items.length}
            </span>
            {focus && (
              <a href="#archive" className="ulink" onClick={(e) => (e.preventDefault(), setFocus(null))}>
                Clear ×
              </a>
            )}
          </div>
        </div>
        {months.map(([k, rows]) => (
          <div key={k} className="g12 month-row">
            <div className="c3">{monthTitle(k)}</div>
            <div className="c9">
              {rows.map((r) => {
                const idx = n++;
                return (
                  <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="lrow">
                    <span className="n">{pad(idx)}</span>
                    <span className="t">{r.title}</span>
                    <span className="meta ell">{r.domain}</span>
                    <span className="meta">{r.tag}</span>
                    <span className="meta r">{dayLabel(r.createdAt)}</span>
                    {writable && (
                      <span
                        className="edit"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDrawer({ mode: "edit", item: r });
                        }}
                      >
                        edit
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        ))}
        {!shown.length && <p className="empty-note">Nothing kept under this field yet.</p>}
      </section>

      <Footer />

      {search && <SearchOverlay items={items} onClose={() => setSearch(false)} />}
      {drawer && <AddDrawer state={drawer} tags={tags} onClose={() => setDrawer(null)} onSaved={upsert} onDeleted={(id) => setItems((p) => p.filter((x) => x.id !== id))} />}
    </div>
  );
}
