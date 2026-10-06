import { Paper, Month, Row } from "yeoziphab-ds";
export const Grouped = () => (
  <Paper style={{ width: 720, paddingLeft: 112 }}>
    <Month label="2026년 8월">
      <Row title="종이는 왜 따뜻하게 느껴지는가" metas={[{ text: "brunch.co.kr", serif: true }, { text: "8. 29", serif: true }]} />
      <Row title="안도 다다오, 빛의 교회 도면" metas={[{ text: "archdaily.com", serif: true }, { text: "8. 13", serif: true }]} />
    </Month>
    <div style={{ height: 44 }} />
    <Month label="2026년 7월" line>
      <Row title="사경(寫經)의 필획에 대해" metas={[{ text: "museum.go.kr", serif: true }, { text: "7. 30", serif: true }]} />
    </Month>
  </Paper>
);
