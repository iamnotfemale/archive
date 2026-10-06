import { Paper, Note } from "yeoziphab-ds";
export const Status = () => (
  <Paper style={{ width: 360 }}>
    <Note>정리되지 않은 것 7</Note>
  </Paper>
);
export const Sub = () => (
  <Paper style={{ width: 360 }}>
    <Note>남긴 것 42</Note>
    <Note sub>열쇠가 없어 읽기만 됩니다</Note>
  </Paper>
);
