import { Paper, Field, Hint } from "yeoziphab-ds";
export const Add = () => (
  <Paper style={{ width: 720 }}>
    <Field size="lg" placeholder="링크를 붙여넣으세요" value="https://muji.com/philosophy/emptiness" action="남기기" />
    <div style={{ height: 36 }} />
    <Field size="md" placeholder="왜 남기나요" value="" />
    <div style={{ height: 22 }} />
    <Field size="sm" placeholder="태그" value="디자인" />
    <div style={{ marginTop: 28 }}><Hint>Esc 로 닫기</Hint></div>
  </Paper>
);
export const Search = () => (
  <Paper style={{ width: 720 }}>
    <Field size="lg" placeholder="찾을 말" value="캡션" action="2" actionDim />
  </Paper>
);
