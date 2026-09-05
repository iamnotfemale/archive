"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/content/site";

/** Left rail shared by every page: name, the three routes, then whatever the page adds. */
export default function Rail({ children }: { children?: React.ReactNode }) {
  const path = usePathname() ?? "/";
  return (
    <div className="side">
      <Link href="/" className="wordmark">
        {site.name}
      </Link>
      <nav className="routes">
        {site.routes.map((r) => (
          <Link key={r.href} href={r.href} className={`route${path === r.href || path.startsWith(r.href + "/") ? " active" : ""}`}>
            {r.label}
          </Link>
        ))}
      </nav>
      {children && <div className="rail-body">{children}</div>}
    </div>
  );
}
