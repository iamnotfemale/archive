"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Work } from "@/lib/types";

/** /portfolio 오른쪽 위 "+": 새 작업 초안을 만들고 편집기로. */
export default function NewWorkButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const create = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/works", { method: "POST" });
      if (!res.ok) throw new Error(String(res.status));
      const { work } = (await res.json()) as { work: Work };
      document.querySelector(".page")?.classList.add("leaving"); // fade out, the editor rises in
      setTimeout(() => router.push(`/portfolio/edit/${work.id}`), 260);
    } catch {
      setBusy(false);
    }
  };
  return (
    <div className="corner plus" title="새 작업" style={{ color: busy ? "rgba(31,29,26,.45)" : "#1F1D1A" }} onClick={() => void create()}>
      +
    </div>
  );
}
