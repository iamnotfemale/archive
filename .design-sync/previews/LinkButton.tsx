import { Paper, LinkButton, Hint } from "yeoziphab-ds";
export const Bar = () => (
  <Paper style={{ width: 640, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
    <Hint>Esc 로 닫기</Hint>
    <LinkButton>발행</LinkButton>
  </Paper>
);
