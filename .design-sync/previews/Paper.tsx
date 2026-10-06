import { Paper, Rail, Note } from "yeoziphab-ds";
export const Default = () => (
  <Paper style={{ width: 640, minHeight: 240 }}>
    <Rail name="yeoziphab" routes={["/archive", "/write", "/portfolio"]} active="/archive">
      <Note>정리되지 않은 것 7</Note>
    </Rail>
  </Paper>
);
