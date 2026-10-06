"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { site } from "@/content/site";

/** Top bar used on every page but the home hero (which carries the nav on its card). */
export default function Nav({ onSearch, onAdd, writable, extra }: { onSearch?: () => void; onAdd?: () => void; writable?: boolean; extra?: React.ReactNode }) {
  const path = usePathname() ?? "/";
  const is = (p: string) => (p === "/" ? path === "/" : path.startsWith(p));
  return (
    <div className="nav">
      <Link href="/" className="brand">
        {site.name}
      </Link>
      <nav>
        <Link href="/" className={is("/") ? "on" : ""}>
          Portfolio
        </Link>
        <Link href="/archive" className={is("/archive") ? "on" : ""}>
          Archive
        </Link>
        <Link href="/write" className={is("/write") ? "on" : ""}>
          Writing
        </Link>
        {onSearch && (
          <a href="#search" onClick={(e) => (e.preventDefault(), onSearch())}>
            /
          </a>
        )}
        {writable && onAdd && (
          <a href="#add" onClick={(e) => (e.preventDefault(), onAdd())}>
            +
          </a>
        )}
        {extra}
      </nav>
      <Clock />
    </div>
  );
}

export function Clock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const f = () => setT(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" }));
    f();
    const i = setInterval(f, 1000);
    return () => clearInterval(i);
  }, []);
  return (
    <span className="clock tnum">
      Seoul · <b>{t}</b>
    </span>
  );
}
