import { Paper, CvSection } from "yeoziphab-ds";
export const Career = () => (
  <Paper style={{ width: 640 }}>
    <CvSection
      label="활동"
      rows={[
        { title: "고려대학교 인공지능학과", sub: "학생회장", when: "2026 —" },
        { title: "GDGKU", sub: "Google Developer Group on KU", when: "2025 —" },
        { title: "AIKU", sub: "고려대학교 딥러닝 학회", when: "2025 —" },
      ]}
    />
  </Paper>
);
