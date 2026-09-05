"use client";

/** 오른쪽 위 "PDF ↓": 브라우저 인쇄 대화상자로 PDF 저장. 인쇄 스타일은 globals.css 의 @media print. */
export default function PrintButton() {
  return (
    <button type="button" className="corner-text" onClick={() => window.print()}>
      PDF ↓
    </button>
  );
}
