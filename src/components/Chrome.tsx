"use client";

import { useEffect, useRef } from "react";

/** Reading-progress bar + the green dot cursor (grows into a ring over links/inputs). */
export default function Chrome() {
  const bar = useRef<HTMLDivElement>(null);
  const cur = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const mv = (e: MouseEvent) => {
      const c = cur.current;
      if (!c) return;
      c.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
      const over = !!(e.target as HTMLElement | null)?.closest?.("a,input,button,textarea,[role=button]");
      c.classList.toggle("over", over);
    };
    const sc = () => {
      const h = document.documentElement;
      if (bar.current) bar.current.style.width = (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)) * 100 + "%";
    };
    window.addEventListener("mousemove", mv);
    window.addEventListener("scroll", sc, { passive: true });
    return () => {
      window.removeEventListener("mousemove", mv);
      window.removeEventListener("scroll", sc);
    };
  }, []);
  return (
    <>
      <div ref={bar} className="sw-bar" />
      <div ref={cur} className="sw-cursor" />
    </>
  );
}
