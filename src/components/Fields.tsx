"use client";

import { useEffect, useRef, useState } from "react";
import { BAYER, SHAPES } from "./Dither";

/** One dot in the graph: an archive link or an essay. */
export type Leaf = { id: string; href: string; external?: boolean; title: string; tag: string; kind: string; sub?: string; date: string };
type Node = { x: number; y: number; vx: number; vy: number };

/** 태그(field)들을 구 하나로 접어 두었다가, 누르면 터져 나와 힘-그래프로 펼쳐진다. 노드는 실제 아카이브 항목. */
export default function Fields({ leaves: items, tags, focus, onFocus, shape = "circle", noun = "links" }: { leaves: Leaf[]; tags: string[]; focus: string | null; onFocus: (t: string | null) => void; shape?: "circle" | "cube"; noun?: string }) {
  const [open, setOpen] = useState(false);
  const [filling, setFilling] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const sphere = useRef<HTMLCanvasElement>(null);
  const sphereWrap = useRef<HTMLAnchorElement>(null);
  const burst = useRef<HTMLCanvasElement>(null);
  const pan = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const st = useRef({
    fill: 0,
    fillC: [0, 0],
    noise: new Float32Array(80 * 80),
    particles: null as null | { x0: number; y0: number; x1: number; y1: number; core?: boolean; deco?: boolean }[],
    burstT: 0,
    sim: {} as Record<string, Node>,
    home: {} as Record<string, [number, number]>,
    mouse: { x: 0.5, y: 0.5, px: -1e4, py: -1e4, vx: 0, vy: 0 },
    focus: null as string | null,
    open: false,
    filling: false,
    grab: null as null | { id: string; sx: number; sy: number; ox: number; oy: number; moved: boolean },
    lastMoved: false,
  });
  useEffect(() => {
    const n = st.current.noise;
    if (!n[0]) for (let i = 0; i < n.length; i++) n[i] = Math.random();
  }, []);
  useEffect(() => {
    st.current.focus = focus;
    st.current.open = open;
    st.current.filling = filling;
  }, [focus, open, filling]);

  // stable homes on a ring around the centre
  useEffect(() => {
    const h: Record<string, [number, number]> = {};
    tags.forEach((t, i) => {
      const a = -Math.PI / 2 + (i / Math.max(1, tags.length)) * Math.PI * 2;
      h[t] = [0.5 + Math.cos(a) * 0.3, 0.5 + Math.sin(a) * 0.32];
    });
    st.current.home = h;
  }, [tags]);

  const byTag = (t: string) => items.filter((i) => i.tag === t);
  const leafId = (i: Leaf) => "L" + i.id;

  const ripple = (e: { clientX: number; clientY: number }) => {
    const el = box.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    [["var(--ac)", "0s"], ["var(--ink)", ".14s"]].forEach(([col, delay]) => {
      const d = document.createElement("div");
      d.style.cssText = `position:absolute;left:${e.clientX - r.left}px;top:${e.clientY - r.top}px;width:460px;height:460px;border-radius:50%;border:1px solid ${col};pointer-events:none;opacity:0;animation:sw-ripple .9s cubic-bezier(.2,.7,.2,1) ${delay} both`;
      el.appendChild(d);
      d.addEventListener("animationend", () => d.remove());
    });
  };
  useEffect(() => {
    const S = st.current;
    const mv = (e: MouseEvent) => {
      const m = S.mouse;
      m.vx = e.clientX - m.px;
      m.vy = e.clientY - m.py;
      m.px = e.clientX;
      m.py = e.clientY;
      m.x = e.clientX / innerWidth;
      m.y = e.clientY / innerHeight;
      const g = S.grab;
      if (g) {
        if (!g.moved && Math.hypot(e.clientX - g.sx, e.clientY - g.sy) > 4) g.moved = true;
        const n = S.sim[g.id];
        if (g.moved && n) {
          n.x = e.clientX - g.ox;
          n.y = e.clientY - g.oy;
          n.vx = n.vy = 0;
        }
      }
    };
    const up = () => {
      if (!S.grab) return;
      S.lastMoved = S.grab.moved;
      S.grab = null;
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", mv);
    window.addEventListener("mouseup", up);
    let raf = 0;
    const homes = (W: number, H: number) => {
      const h: Record<string, [number, number]> = {};
      const t = performance.now() / 1000;
      const cx = W / 2;
      const cy = H / 2;
      tags.forEach((k, i) => {
        const [fx, fy] = S.home[k];
        h[k] = [fx * W + Math.sin(t * 0.19 + i * 1.7) * 12, fy * H + Math.cos(t * 0.15 + i * 1.7) * 12];
      });
      for (const k of tags) {
        const list = byTag(k);
        const n = list.length;
        const [hx, hy] = h[k];
        if (k === S.focus) {
          const R = Math.min(W, H) * 0.3;
          list.forEach((l, i) => {
            const a = -Math.PI / 2 + (i / n) * Math.PI * 2 + Math.sin(t * 0.3 + i) * 0.05;
            h[leafId(l)] = [hx + Math.cos(a) * R * 1.15, hy + Math.sin(a) * R];
          });
        } else {
          const out = Math.atan2(hy - cy, hx - cx);
          list.forEach((l, i) => {
            const a = out + (i - (n - 1) / 2) * 0.75 + Math.sin(t * 0.17 + i * 2) * 0.05;
            const R = 72 + (i % 2) * 28;
            h[leafId(l)] = [hx + Math.cos(a) * R * 1.05, hy + Math.sin(a) * R];
          });
        }
      }
      return h;
    };
    const drawSphere = () => {
      const cv = sphere.current;
      if (!cv) return;
      if (S.filling && S.fill < 1) {
        S.fill = Math.min(1, S.fill + 1 / 150);
        if (S.fill >= 1) doBurst();
      }
      const g = cv.getContext("2d")!;
      const N = cv.width;
      const img = g.createImageData(N, N);
      const d = img.data;
      const m = S.mouse;
      const lx = (m.x - 0.5) * 1.6;
      const ly = (m.y - 0.5) * 1.6;
      const lz = 0.8;
      const ln = Math.hypot(lx, ly, lz);
      const t = performance.now() / 4000;
      for (let j = 0; j < N; j++)
        for (let i = 0; i < N; i++) {
          const u = ((i + 0.5) / N) * 2 - 1;
          const v = ((j + 0.5) / N) * 2 - 1;
          const o = (j * N + i) * 4;
          const nrm = SHAPES[shape](u, v);
          if (!nrm) {
            d[o + 3] = 0;
            continue;
          }
          const s = Math.max(0, (nrm[0] * lx + nrm[1] * ly + nrm[2] * lz) / (ln * Math.hypot(nrm[0], nrm[1], nrm[2])));
          const val = Math.pow(s, 1.4) * 0.9 + Math.sin(u * 9 + t) * Math.cos(v * 9 - t) * 0.12 + 0.08;
          const on = val > (BAYER[(j % 4) * 4 + (i % 4)] + 0.5) / 16;
          const filled = S.fill > 0 && S.noise[j * N + i] < (S.fill * 3.3 - Math.hypot(u - S.fillC[0], v - S.fillC[1])) * 0.9;
          if (filled) {
            if (on) {
              d[o] = 214;
              d[o + 1] = 242;
              d[o + 2] = 222;
            } else {
              d[o] = 11;
              d[o + 1] = 168;
              d[o + 2] = 74;
            }
          } else d[o] = d[o + 1] = d[o + 2] = on ? 242 : 11;
          d[o + 3] = 255;
        }
      g.putImageData(img, 0, 0);
    };
    const doBurst = () => {
      const el = box.current;
      const w = sphereWrap.current;
      if (!el || !w) return;
      const r = el.getBoundingClientRect();
      const sr = w.getBoundingClientRect();
      const hs = homes(r.width, r.height);
      const ps: NonNullable<typeof S.particles> = [];
      const onSphere = () => {
        const a = Math.random() * Math.PI * 2;
        const dd = Math.sqrt(Math.random()) * 0.9;
        return [sr.left - r.left + sr.width / 2 + (Math.cos(a) * dd * sr.width) / 2, sr.top - r.top + sr.height / 2 + (Math.sin(a) * dd * sr.height) / 2];
      };
      for (const id in hs) {
        const [x0, y0] = onSphere();
        ps.push({ x0, y0, x1: hs[id][0], y1: hs[id][1], core: tags.includes(id) });
      }
      for (let i = 0; i < 70; i++) {
        const [x0, y0] = onSphere();
        const a = Math.random() * Math.PI * 2;
        const dd = 160 + Math.random() * 320;
        ps.push({ x0, y0, x1: x0 + Math.cos(a) * dd, y1: y0 + Math.sin(a) * dd, deco: true });
      }
      S.particles = ps;
      S.burstT = 0;
      ripple({ clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 });
      w.style.transform = "translate(-50%,-50%) scale(1.15)";
      w.style.opacity = "0";
    };
    const stepParticles = () => {
      const cv = burst.current;
      const ps = S.particles;
      if (!cv || !ps || !box.current) return;
      const r = box.current.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      if (cv.width !== r.width * dpr) {
        cv.width = r.width * dpr;
        cv.height = r.height * dpr;
      }
      const g = cv.getContext("2d")!;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, r.width, r.height);
      S.burstT = Math.min(1, S.burstT + 1 / 66);
      const T = S.burstT;
      const ease = 1 - Math.pow(1 - T, 3);
      for (const p of ps) {
        const x = p.x0 + (p.x1 - p.x0) * ease;
        const y = p.y0 + (p.y1 - p.y0) * ease;
        g.globalAlpha = p.deco ? Math.max(0, 1 - T * 1.15) : 1;
        g.fillStyle = p.core ? "#0B0B0B" : "#0BA84A";
        const sz = p.deco ? 6 : p.core ? 14 : 12;
        g.fillRect(x - sz / 2, y - sz / 2, sz, sz);
      }
      if (T >= 1) {
        S.particles = null;
        setFilling(false);
        setOpen(true);
      }
    };
    const stepField = () => {
      const el = box.current;
      const sv = svg.current;
      if (!el || !sv || !S.open) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const W = r.width;
      const H = r.height;
      const hs = homes(W, H);
      const sim = S.sim;
      const f = S.focus;
      const speed = Math.hypot(S.mouse.vx, S.mouse.vy);
      const panXY = f ? [(0.5 - S.home[f][0]) * W, (0.5 - S.home[f][1]) * H] : [0, 0];
      if (pan.current) pan.current.style.transform = `translate(${panXY[0]}px,${panXY[1]}px)`;
      const mx = S.mouse.px - r.left - panXY[0];
      const my = S.mouse.py - r.top - panXY[1];
      const ids = Object.keys(hs);
      for (const id of ids) {
        if (sim[id]) continue;
        const src = f && id[0] === "L" ? sim[f] : null;
        sim[id] = src ? { x: src.x, y: src.y, vx: 0, vy: 0 } : { x: hs[id][0], y: hs[id][1], vx: 0, vy: 0 };
      }
      for (const id of ids) {
        const n = sim[id];
        const [hx, hy] = hs[id];
        if (S.grab && S.grab.id === id && S.grab.moved) {
          const node = el.querySelector<HTMLElement>(`[data-node="${CSS.escape(id)}"]`);
          if (node) {
            node.style.left = n.x + "px";
            node.style.top = n.y + "px";
          }
          continue;
        }
        n.vx += (hx - n.x) * 0.02;
        n.vy += (hy - n.y) * 0.02;
        const dx = n.x - mx;
        const dy = n.y - my;
        const dd = Math.hypot(dx, dy) || 1;
        if (dd < 90 && speed > 3) {
          const ff = (1 - dd / 90) * speed * 0.05;
          n.vx += (dx / dd) * ff;
          n.vy += (dy / dd) * ff;
        }
        for (const o of ids) {
          if (o <= id || (o[0] === "L") !== (id[0] === "L")) continue;
          const q = sim[o];
          const ex = n.x - q.x;
          const ey = n.y - q.y;
          const e = Math.hypot(ex, ey) || 1;
          if (e < 36) {
            const ff = (1 - e / 36) * 0.25;
            n.vx += (ex / e) * ff;
            n.vy += (ey / e) * ff;
            q.vx -= (ex / e) * ff;
            q.vy -= (ey / e) * ff;
          }
        }
        n.vx *= 0.86;
        n.vy *= 0.86;
        n.x += n.vx;
        n.y += n.vy;
        const node = el.querySelector<HTMLElement>(`[data-node="${CSS.escape(id)}"]`);
        if (node) {
          node.style.left = n.x.toFixed(1) + "px";
          node.style.top = n.y.toFixed(1) + "px";
        }
      }
      const P = (id: string) => (id === "C" ? [W / 2, H / 2] : sim[id] ? [sim[id].x, sim[id].y] : [W / 2, H / 2]);
      sv.querySelectorAll("line").forEach((l) => {
        const a = P(l.dataset.a!);
        const b = P(l.dataset.b!);
        l.setAttribute("x1", String(a[0]));
        l.setAttribute("y1", String(a[1]));
        l.setAttribute("x2", String(b[0]));
        l.setAttribute("y2", String(b[1]));
      });
      S.mouse.vx *= 0.8;
      S.mouse.vy *= 0.8;
    };
    const loop = () => {
      raf = requestAnimationFrame(loop);
      drawSphere();
      stepParticles();
      stepField();
    };
    loop();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", mv);
      window.removeEventListener("mouseup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, tags, shape]);

  const fillSphere = (e: React.MouseEvent) => {
    e.preventDefault();
    if (filling) return;
    const cv = sphere.current;
    if (cv) {
      const r = cv.getBoundingClientRect();
      st.current.fillC = [((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1];
    }
    setFilling(true);
    ripple(e);
  };
  const placeTip = (node: HTMLElement) => {
    const tip = node.querySelector<HTMLElement>(".tip");
    const b = box.current?.getBoundingClientRect();
    if (!tip || !b) return;
    const n = node.getBoundingClientRect();
    const W = 216;
    const Hh = tip.offsetHeight || 96;
    const cx = n.left + n.width / 2;
    const dx = Math.max(b.left + 8 + W / 2, Math.min(b.right - 8 - W / 2, cx)) - cx;
    tip.style.left = `calc(50% + ${dx.toFixed(0)}px)`;
    const below = n.bottom + 20 + Hh + 8 < b.bottom;
    tip.style.top = below ? "20px" : "auto";
    tip.style.bottom = below ? "auto" : "20px";
  };

  const note = !open ? `${tags.length} fields, folded into one ${shape === "cube" ? "cube" : "sphere"}` : focus ? `${focus} — ${byTag(focus).length} ${noun} · click the centre to fold back` : "Touch to disturb · click a field to unfold it";
  const edges = focus
    ? [...tags.map((k) => ({ a: "C", b: k, op: k === focus ? 0.9 : 0.12, dash: "" })), ...items.filter((i) => i.tag).map((l) => ({ a: l.tag, b: leafId(l), op: l.tag === focus ? 0.5 : 0.05, dash: "" }))]
    : [...tags.map((k) => ({ a: "C", b: k, op: 0.9, dash: "" })), ...tags.map((k, i) => ({ a: k, b: tags[(i + 1) % tags.length], op: 0.22, dash: "3 5" })), ...items.filter((i) => i.tag).map((l) => ({ a: l.tag, b: leafId(l), op: 0.14, dash: "" }))];

  return (
    <section id="fields" className="wrap">
      <div className="g12 sec-head soft">
        <div className="c3">
          <span className="sec-no">00</span>
          <span className="sec-title">Fields</span>
        </div>
        <div className="c9 sec-note">{note}</div>
      </div>
      <div ref={box} className="field-box">
        {!open && (
          <>
            <a ref={sphereWrap} href="#fields" className="sphere-wrap" onClick={fillSphere}>
              <canvas ref={sphere} width={80} height={80} />
            </a>
            <canvas ref={burst} className="burst" />
            <div className="sphere-note">{filling ? "Filling…" : `Click the ${shape === "cube" ? "cube" : "sphere"} to open the fields`}</div>
          </>
        )}
        {open && (
          <div ref={pan} className="pan">
            <svg ref={svg}>
              {edges.map((e, i) => (
                <line key={i} data-a={e.a} data-b={e.b} stroke="currentColor" strokeWidth={1} opacity={e.op} strokeDasharray={e.dash} />
              ))}
            </svg>
            <a
              href="#fields"
              className={`hub${focus ? " focused" : ""}`}
              title="All fields"
              onClick={(e) => {
                e.preventDefault();
                ripple(e);
                onFocus(null);
              }}
            />
            {tags.map((k) => (
              <a
                key={k}
                href="#fields"
                data-node={k}
                className={`core${focus === k ? " on" : ""}${focus && focus !== k ? " off" : ""}`}
                onMouseDown={(e) => {
                  if (e.button !== 0) return;
                  e.preventDefault();
                  const S = st.current;
                  const el = box.current;
                  if (!el || !S.sim[k]) return;
                  const r = el.getBoundingClientRect();
                  const pan = focus ? [(0.5 - S.home[focus][0]) * r.width, (0.5 - S.home[focus][1]) * r.height] : [0, 0];
                  S.grab = { id: k, sx: e.clientX, sy: e.clientY, ox: r.left + pan[0], oy: r.top + pan[1], moved: false };
                  document.body.style.userSelect = "none";
                }}
                onClick={(e) => {
                  e.preventDefault();
                  if (st.current.lastMoved) {
                    st.current.lastMoved = false;
                    return;
                  }
                  ripple(e);
                  onFocus(focus === k ? null : k);
                }}
              >
                {k} <small>{byTag(k).length}</small>
              </a>
            ))}
            {items
              .filter((i) => i.tag)
              .map((l) => (
                <a
                  key={l.id}
                  href={l.href}
                  target={l.external ? "_blank" : undefined}
                  rel={l.external ? "noreferrer" : undefined}
                  data-node={leafId(l)}
                  className={`leaf${!focus || l.tag !== focus ? " dim" : ""}${focus && l.tag !== focus ? " off" : ""}`}
                  onMouseEnter={(e) => placeTip(e.currentTarget)}
                >
                  <span className="tip">
                    <span className="k">
                      {l.tag} · {l.kind}
                    </span>
                    <span className="t">{l.title}</span>
                    {l.sub && <span className="d">{l.sub}</span>}
                    <span className="m">{l.date}</span>
                  </span>
                </a>
              ))}
          </div>
        )}
      </div>
    </section>
  );
}
