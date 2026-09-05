/**
 * /portfolio 내용. 자리표시자이니 실제 이력과 작업으로 바꾸세요.
 * 이미지는 public/work/ 아래에 두고 src 에 "/work/파일명" 으로 적으면 됩니다. src 를 비우면 옅은 자리만 그려집니다.
 */

export interface CvRow {
  title: string;
  sub: string;
  when: string;
}
export interface CvBlock {
  label: string;
  rows: CvRow[];
}

export type WorkSection =
  | { type: "text"; text: string }
  | { type: "image"; src?: string; caption?: string; height?: number }
  | { type: "images"; items: { src?: string; caption?: string }[]; height?: number };

export interface Work {
  slug: string;
  title: string;
  kind: string; // 브랜딩 · 제품 · 인쇄 …
  role: string;
  year: string;
  note: string; // 목록 호버 미리보기의 한두 줄
  thumb?: string; // 호버 썸네일 (없으면 옅은 자리)
  sections: WorkSection[];
}

export const cv: CvBlock[] = [
  {
    label: "지금",
    rows: [
      { title: "프리랜스", sub: "브랜딩 · 제품 디자인", when: "2024 —" },
      { title: "작은 출판 프로젝트 «빈 방»", sub: "편집 · 디자인", when: "2025 —" },
    ],
  },
  {
    label: "경력",
    rows: [
      { title: "스튜디오 이름", sub: "시니어 디자이너 · 아이덴티티, 제품", when: "2021 — 2024" },
      { title: "회사 이름", sub: "프로덕트 디자이너 · 웹, 앱", when: "2018 — 2021" },
      { title: "인쇄소 이름", sub: "조판 · 교정", when: "2017 — 2018" },
    ],
  },
  {
    label: "학력",
    rows: [{ title: "대학 이름", sub: "시각디자인 학사", when: "2013 — 2017" }],
  },
];

export const works: Work[] = [
  {
    slug: "serial-museum",
    title: "세로 미술관 아이덴티티",
    kind: "브랜딩",
    role: "아이덴티티 · 사인",
    year: "2026",
    note: "전시장보다 앞서지 않는 아이덴티티. 로고를 키우는 대신 자리만 정해 두었다.",
    sections: [
      {
        type: "text",
        text: "전시장보다 앞서지 않는 아이덴티티를 목표로 했습니다. 로고를 키우는 대신 글자의 위치와 크기만 정해 두고, 남는 자리는 전시가 채우게 했습니다. 인쇄물은 한 색, 사인은 두께만 다르게.",
      },
      { type: "image", caption: "전시장 입구 사인. 두께 두 종류로 층위를 만든다.", height: 400 },
      { type: "images", items: [{ caption: "이미지" }, { caption: "이미지" }], height: 240 },
      {
        type: "text",
        text: "서체는 본문용 하나로 줄였습니다. 캡션과 날짜만 세리프를 써서, 정보의 층위가 색이 아니라 서체의 성격으로 갈리게 했습니다.",
      },
    ],
  },
  {
    slug: "paper-archive",
    title: "종이 잡지 웹 아카이브",
    kind: "제품",
    role: "설계 · 화면",
    year: "2026",
    note: "20년 치 지면을 한 색으로 옮긴 열람 화면. 스캔 위에 글자를 얹지 않았다.",
    sections: [
      { type: "text", text: "지면을 스캔한 이미지 위에 아무것도 얹지 않기로 했습니다. 목차와 검색은 여백에 두고, 지면은 지면으로만 보이게." },
      { type: "image", caption: "열람 화면", height: 400 },
    ],
  },
  {
    slug: "type-specimen",
    title: "활자 견본집 사이트",
    kind: "제품",
    role: "설계 · 화면",
    year: "2025",
    note: "자간과 크기를 직접 만져 보는 견본. 설명보다 손이 빠르다.",
    sections: [{ type: "text", text: "설명 대신 슬라이더 하나. 자간과 크기를 직접 만지면 서체가 스스로 말합니다." }],
  },
  {
    slug: "bookshop-posters",
    title: "로컬 서점 포스터 시리즈",
    kind: "인쇄",
    role: "디자인",
    year: "2025",
    note: "한 색 실크스크린 열두 장. 매달 한 문장씩만 바꿨다.",
    sections: [{ type: "images", items: [{ caption: "1월" }, { caption: "2월" }], height: 300 }],
  },
  {
    slug: "press-identity",
    title: "소규모 출판사 브랜딩",
    kind: "브랜딩",
    role: "아이덴티티",
    year: "2025",
    note: "판형이 브랜드가 되도록. 표지는 제목과 여백만.",
    sections: [{ type: "text", text: "판형 하나를 정하고, 표지는 제목과 여백만으로. 시리즈가 쌓일수록 브랜드가 됩니다." }],
  },
  {
    slug: "empty-rooms",
    title: "사진집 «빈 방» 편집",
    kind: "인쇄",
    role: "편집 · 조판",
    year: "2024",
    note: "빈 방 서른두 장의 순서를 정하는 일이 곧 디자인이었다.",
    sections: [{ type: "text", text: "서른두 장의 순서를 정하는 데 두 달을 썼습니다. 순서가 정해지자 나머지는 저절로 정해졌습니다." }],
  },
];
