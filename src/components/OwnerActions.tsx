"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/** 글·작업 상세의 "수정 · 삭제". 삭제는 두 번 눌러야 합니다. */
export default function OwnerActions({ editHref, deleteUrl, afterDelete }: { editHref: string; deleteUrl: string; afterDelete: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const remove = async () => {
    if (!confirm) {
      setConfirm(true);
      setTimeout(() => setConfirm(false), 4000);
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(deleteUrl, { method: "DELETE" });
      if (!res.ok) throw new Error(String(res.status));
      document.querySelector(".page")?.classList.add("leaving");
      setTimeout(() => router.push(afterDelete), 260);
    } catch {
      setBusy(false);
      setConfirm(false);
    }
  };
  return (
    <span className="owner-actions">
      <Link href={editHref}>수정</Link>
      <span onClick={() => void remove()} style={{ color: confirm ? "#1F1D1A" : undefined }}>
        {busy ? "지우는 중" : confirm ? "정말 삭제" : "삭제"}
      </span>
    </span>
  );
}
