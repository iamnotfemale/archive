"use client";

import { useRef, useState } from "react";
import type { Profile } from "@/lib/types";
import { site } from "@/content/site";

/** Business card: drag to rotate, button to flip. */
export default function Card({ profile }: { profile: Profile }) {
  const [rot, setRot] = useState(0);
  const [drag, setDrag] = useState(false);
  const start = useRef<{ x: number; rot: number } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    start.current = { x: e.clientX, rot };
    setDrag(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => start.current && setRot(start.current.rot + (e.clientX - start.current.x) * 0.5);
  const onUp = () => {
    if (!start.current) return;
    start.current = null;
    setDrag(false);
    setRot((r) => Math.round(r / 180) * 180);
  };
  return (
    <div className="card-stage">
      <div>
        <div className="card3d" style={{ transform: `rotateY(${rot}deg)`, transition: drag ? "none" : "transform .6s cubic-bezier(.2,.8,.2,1)" }} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <div className="face front">
            <div className="name">{site.name}</div>
            <div className="sq" />
            <div className="bio">{profile.intro}</div>
            <div className="mute">Seoul, KR</div>
            <div className="mute">Drag to turn</div>
          </div>
          <div className="face back">
            <div className="mute" style={{ color: "rgba(255,255,255,.5)" }}>
              Contact
            </div>
            <div className="links">
              {profile.contacts.map((c) =>
                c.href ? (
                  <a key={c.id} href={c.href} target={c.href.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer">
                    {c.label} · {c.value}
                  </a>
                ) : (
                  <span key={c.id}>
                    {c.label} · {c.value}
                  </span>
                ),
              )}
            </div>
            <div style={{ color: "rgba(255,255,255,.5)", fontSize: 12 }}>{site.name} · Seoul</div>
          </div>
        </div>
        <button className="flip" onClick={() => setRot((r) => r + 180)}>
          Flip <span style={{ color: "var(--ac)" }}>↻</span>
        </button>
      </div>
    </div>
  );
}
