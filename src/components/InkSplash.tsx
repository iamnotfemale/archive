"use client";

import { useEffect } from "react";

/** 클릭한 자리에 먹이 몇 방울 튄다. 장식일 뿐이라 DOM 에 잠깐 있다 사라진다. */
export default function InkSplash() {
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const n = 5 + Math.floor(Math.random() * 4);
      for (let i = 0; i < n; i++) {
        const d = document.createElement("span");
        d.className = "ink-drop";
        const a = Math.random() * Math.PI * 2;
        const r = 10 + Math.random() * 26;
        d.style.left = e.clientX + "px";
        d.style.top = e.clientY + "px";
        d.style.setProperty("--dx", Math.cos(a) * r + "px");
        d.style.setProperty("--dy", Math.sin(a) * r + "px");
        d.style.setProperty("--s", (2 + Math.random() * 4).toFixed(1) + "px");
        document.body.appendChild(d);
        d.addEventListener("animationend", () => d.remove());
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);
  return null;
}
