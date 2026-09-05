/**
 * /portfolio 의 이력 부분. 작업(works)은 사이트에서 직접 씁니다 (/portfolio 의 + 버튼).
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

export const cv: CvBlock[] = [
  // {
  //   label: "지금",
  //   rows: [
  //     { title: "AIKU", sub: "브랜딩 · 제품 디자인", when: "2024 —" },
  //     { title: "작은 출판 프로젝트 «빈 방»", sub: "편집 · 디자인", when: "2025 —" },
  //   ],
  // },
  {
    label: "경력",
    rows: [
      { title: "고려대학교 인공지능학과", sub: "제2대 학생회장", when: "2025 — " },
      { title: "VIKA", sub: "CTO", when: "2016 — " },
      { title: "AIKU", sub: "Senior", when: "2025 — " },
      { title: "GDGKU", sub: "AI/ML/DL Engineer", when: "2025 — " },
      { title: "NewLearn", sub: "13th", when: "2025" },
    ],
  },
  {
    label: "학력",
    rows: [{ title: "고려대학교", sub: "인공지능학과", when: "2015 — " }],
  },
];
