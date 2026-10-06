"use client";

import { useEffect, useRef } from "react";

/** True when the element or an ancestor is something you can click: a link/control, or any element React gave a click/press handler. */
function clickable(el: HTMLElement | null) {
  for (let n = el; n && n !== document.body; n = n.parentElement) {
    if (n.matches("a,input,button,textarea,select,label,summary,[role=button]")) return true;
    const key = Object.keys(n).find((k) => k.startsWith("__reactProps"));
    const props = key ? (n as unknown as Record<string, Record<string, unknown>>)[key] : null;
    if (props && (props.onClick || props.onPointerDown || props.onMouseDown)) return true;
  }
  return false;
}

/** Reading-progress bar + the green dot cursor (grows into a ring over links/inputs). */
export default function Chrome() {
  const bar = useRef<HTMLDivElement>(null);
  const cur = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const mv = (e: MouseEvent) => {
      const c = cur.current;
      if (!c) return;
      c.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
      c.classList.toggle("over", clickable(e.target as HTMLElement | null));
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
