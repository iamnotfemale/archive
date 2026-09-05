/**
 * 사이트 전체에서 쓰는 이름·소개·연락처. 여기만 고치면 됩니다.
 */
export const site = {
  /** 왼쪽 위 이름 (모든 페이지). */
  name: "yeoziphab",
  /** 첫 화면과 /portfolio 맨 위 한 문장. */
  intro: "Hello World.",
  /** /portfolio 소개 아래 짧은 설명. */
  sub: "우리는 어떻게 살아가야 하는가",
  routes: [
    { href: "/archive", label: "/archive" },
    { href: "/write", label: "/write" },
    { href: "/portfolio", label: "/portfolio" },
  ],
  contacts: [
    { label: "이메일", value: "yeoziphab@korea.ac.kr", href: "mailto:yeoziphab@korea.ac.kr" },
    { label: "인스타그램", value: "@gong.zip.hab", href: "https://instagram.com/gong.zip.hab" },
    { label: "깃허브", value: "iamnotfemale", href: "https://github.com/iamnotfemale" },
  ],
} as const;
