"use client";

import { useRef } from "react";
import { site } from "@/content/site";
import { Clock } from "./Nav";

/** The white business card in a hero. `children` is the nav list; the card tilts toward the pointer while it moves over the hero. */
export default function Bizcard({ children }: { children: React.ReactNode }) {
  const card = useRef<HTMLDivElement>(null);
  const mail = site.contacts.find((c) => c.href.startsWith("mailto:"));
  return (
    <div ref={card} className="bizcard" data-bizcard>
      <div>
        <div className="name">{site.name}</div>
        <div className="mute" style={{ marginTop: 4 }}>
          Developer & student
          <br />
          Dept. of AI, Korea University
        </div>
      </div>
      <nav>{children}</nav>
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
  );
}

/** Hero-level mouse handlers that tilt the card inside it. */
export const tiltHandlers = {
  onMouseMove: (e: React.MouseEvent<HTMLElement>) => {
    const c = e.currentTarget.querySelector<HTMLElement>("[data-bizcard]");
    if (!c) return;
    const r = c.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    c.style.transform = Math.abs(x) < 1.2 && Math.abs(y) < 1.6 ? `perspective(900px) rotateX(${-y * 8}deg) rotateY(${x * 10}deg)` : "none";
  },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
    const c = e.currentTarget.querySelector<HTMLElement>("[data-bizcard]");
    if (c) c.style.transform = "none";
  },
};
