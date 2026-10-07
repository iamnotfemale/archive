"use client";

import { useEffect, useRef } from "react";
import type { Profile } from "@/lib/types";
import { site } from "@/content/site";

/** Business card: drag to tumble (both axes), inertia, settles back to the nearest face; button flips. */
export default function Card({ profile }: { profile: Profile }) {
  const el = useRef<HTMLDivElement>(null);
  const rot = useRef({ x: 0, y: 0, vx: 0, vy: 0, drag: false, face: 0, px: 0, py: 0 });

  useEffect(() => {
    const r = rot.current;
    const move = (e: PointerEvent) => {
      if (!r.drag) return;
      r.vy = (e.clientX - r.px) * 0.5;
      r.vx = -(e.clientY - r.py) * 0.5;
      r.px = e.clientX;
      r.py = e.clientY;
      r.y += r.vy;
      r.x += r.vx;
    };
    // on release, land on whichever face the card is closest to (counting the spin it still has)
    const up = () => {
      if (r.drag) {
        const proj = r.y + r.vy * 8;
        r.face = (((Math.round(proj / 180) * 180) % 360) + 360) % 360;
      }
      r.drag = false;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    let raf = 0;
    const step = () => {
      raf = requestAnimationFrame(step);
      if (!r.drag) {
        r.x += r.vx;
        r.y += r.vy;
        r.vx *= 0.92;
        r.vy *= 0.92;
        r.x += (0 - r.x) * 0.035;
        const ty = Math.round((r.y - r.face) / 360) * 360 + r.face;
        r.y += (ty - r.y) * 0.035;
      }
      if (el.current) el.current.style.transform = `rotateX(${r.x}deg) rotateY(${r.y}deg)`;
    };
    step();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  const down = (e: React.PointerEvent) => {
    e.preventDefault();
    const r = rot.current;
    r.drag = true;
    r.vx = r.vy = 0;
    r.px = e.clientX;
    r.py = e.clientY;
  };
  const flip = () => {
    const r = rot.current;
    r.face = r.face === 0 ? 180 : 0;
    r.vx = r.vy = 0;
  };
  const now = new Date();
  const updated = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}`;
  const link = (c: Profile["contacts"][number]) =>
    c.href ? (
      <a key={c.id} href={c.href} target={c.href.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer">
        {c.value}
      </a>
    ) : (
      <span key={c.id}>{c.value}</span>
    );

  return (
    <div className="card-stage">
      <div>
        <div ref={el} className="card3d" onPointerDown={down}>
          <div className="face front">
            <div>
              <div className="name">{site.name}</div>
              <div className="mute" style={{ marginTop: 4 }}>
                Developer &amp; student
              </div>
            </div>
            <div className="sq" />
            <div className="bio">Builds tools for reading and remembering. Runs two student communities at Korea University.</div>
            <div className="mute" style={{ gridColumn: 1 }}>
              Seoul, KR
            </div>
            <div className="mute" style={{ gridColumn: 2, textAlign: "right" }}>
              Drag to turn
            </div>
          </div>
          <div className="face back">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 600 }}>Contact</span>
              <span style={{ opacity: 0.6 }}>Updated {updated}</span>
            </div>
            <div className="links">{profile.contacts.map(link)}</div>
            <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.6 }}>
              <span>Dept. of AI, Korea University</span>
              <span>Seoul, KR</span>
            </div>
          </div>
        </div>
        <button className="flip" onClick={flip} title="Flip">
          <span style={{ fontSize: 16, lineHeight: 1 }}>⇄</span>Flip
        </button>
      </div>
    </div>
  );
}
