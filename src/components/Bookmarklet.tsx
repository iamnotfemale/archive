"use client";

import { useEffect, useRef } from "react";

/** A draggable bookmarklet link. The href is set outside React so the javascript: URL is not sanitized. */
export default function Bookmarklet({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const origin = window.location.origin;
    const code =
      "javascript:(function(){var u=" +
      JSON.stringify(origin) +
      "+'/add?url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title);" +
      "var w=520,h=560;window.open(u,'archive_add','width='+w+',height='+h+',left='+Math.round((screen.width-w)/2)+',top='+Math.round((screen.height-h)/2)+',resizable=yes,scrollbars=yes');})();";
    ref.current?.setAttribute("href", code);
  }, []);
  return (
    <a ref={ref} title="archive에 남기기 — 북마크바로 끌어다 놓으세요" draggable onClick={(e) => e.preventDefault()}>
      {children}
    </a>
  );
}
