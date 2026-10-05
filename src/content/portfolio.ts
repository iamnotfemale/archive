/**
 * /portfolio 이력의 첫 기본값. 이후에는 사이트의 수정 모드(&)에서 고친 값(DB profile)이 우선한다.
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
  {
    label: "활동",
    rows: [
      { title: "고려대학교 인공지능학과", sub: "학생회장", when: "2026 —" },
      { title: "VIKA", sub: "예비창업팀 · CTO", when: "2026 —" },
      { title: "Pulse", sub: "고려대학교 정보대학 학생회 개발 TF", when: "2026 —" },
      { title: "Pulse", sub: "고려대학교 정보대학 학생회 재정운용위원회 위원장", when: "2026" },
      { title: "늘빛", sub: "고려대학교 인공지능학과 학생회 회칙개정특별위원회 위원장", when: "2026" },
      { title: "GDGKU", sub: "Google Developer Group on KU", when: "2025 —" },
      { title: "AIKU", sub: "고려대학교 딥러닝 학회", when: "2025 —" },
      { title: "NewLearn", sub: "고려대학교 뇌과학 학회", when: "2025" },
    ],
  },
  {
    label: "수상",
    rows: [
      { title: "2026 블록체인 & AI 해커톤", sub: "우수상", when: "2026" },
      { title: "GDGKU BYPP 해커톤", sub: "대상", when: "2026" },
      { title: "제1회 SKYSH 해커톤", sub: "은상", when: "2026" },
      { title: "LG Aimers 8기", sub: "최종 2위", when: "2026" },
      { title: "강원특별자치도 미래인재", sub: "선정", when: "2026" },
      { title: "제3회 InThon 데이터톤", sub: "고려대학교 정보대학 · 금상", when: "2025" },
    ],
  },
  {
    label: "학력",
    rows: [
      { title: "고려대학교", sub: "인공지능학과", when: "2025 —" },
      { title: "강원과학고등학교", sub: "졸업", when: "2024" },
    ],
  },
];
