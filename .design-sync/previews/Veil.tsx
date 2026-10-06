import { Paper, Veil, Field, Row, Hint } from "yeoziphab-ds";
export const AddSheet = () => (
  <Paper style={{ width: 760, height: 420, paddingLeft: 112 }}>
    <Row title="종이는 왜 따뜻하게 느껴지는가" metas={[{ text: "brunch.co.kr", serif: true }]} />
    <Row title="Muji: The Aesthetics of Emptiness" metas={[{ text: "muji.com", serif: true }]} />
    <Row title="한글 자간, 얼마나 좁혀야 하나" metas={[{ text: "typo.kr", serif: true }]} />
    <Veil open>
      <Field size="lg" placeholder="링크를 붙여넣으세요" value="https://typo.kr/letter-spacing" action="남기기" />
      <div style={{ height: 36 }} />
      <Field size="md" placeholder="왜 남기나요" value="-1% 근처가 답이라는 주장." />
      <div style={{ height: 22 }} />
      <Field size="sm" placeholder="태그" value="타이포" />
      <div style={{ marginTop: 28 }}><Hint>Esc 로 닫기</Hint></div>
    </Veil>
  </Paper>
);
