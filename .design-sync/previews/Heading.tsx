import { Paper, Heading, Paragraph } from "yeoziphab-ds";
export const Post = () => (
  <Paper style={{ width: 640 }}>
    <Heading title="먹의 농담, 스크린 위에서" subtitle="먹은 하나, 농담은 여럿" metas={["디자인", "2026. 9. 5"]} />
    <div style={{ height: 44 }} />
    <Paragraph>스크린에는 농담이 없다. 붓이 종이에 닿는 순간의 무게, 먹이 번지며 남기는 경계 같은 것들은 픽셀에 옮겨지지 않는다.</Paragraph>
  </Paper>
);
