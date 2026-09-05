/**
 * 사이트 전체에서 쓰는 이름·소개·연락처. 여기만 고치면 됩니다.
 */
export const site = {
  /** 왼쪽 위 이름 (모든 페이지). */
  name: "yeoziphab",
  /** 첫 화면과 /portfolio 맨 위 한 문장. */
  intro: "읽고 남기고, 그것으로 만듭니다.",
  /** /portfolio 소개 아래 짧은 설명. */
  sub: "서울. 지금은 작은 팀의 아이덴티티와 제품 화면을 함께 만듭니다.",
  routes: [
    { href: "/archive", label: "/archive" },
    { href: "/write", label: "/write" },
    { href: "/portfolio", label: "/portfolio" },
  ],
  contacts: [
    { label: "이메일", value: "hello@example.com", href: "mailto:hello@example.com" },
    { label: "인스타그램", value: "@username", href: "https://instagram.com/username" },
    { label: "깃허브", value: "iamnotfemale", href: "https://github.com/iamnotfemale" },
  ],
} as const;
