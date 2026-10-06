import { Paper, Rail, Note, Tags } from "yeoziphab-ds";
export const Archive = () => (
  <Paper style={{ width: 360 }}>
    <Rail name="yeoziphab" routes={["/archive", "/write", "/portfolio"]} active="/archive">
      <Note>정리되지 않은 것 7</Note>
      <div style={{ marginTop: 28 }}>
        <Tags tags={["전체", "글", "디자인", "타이포", "건축", "사진"]} active="전체" />
      </div>
    </Rail>
  </Paper>
);
export const Write = () => (
  <Paper style={{ width: 360 }}>
    <Rail name="yeoziphab" routes={["/archive", "/write", "/portfolio"]} active="/write">
      <Note>초안 3</Note>
      <Note sub>열쇠가 없어 읽기만 됩니다</Note>
    </Rail>
  </Paper>
);
