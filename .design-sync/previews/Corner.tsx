import { Paper, Corner } from "yeoziphab-ds";
export const Glyphs = () => (
  <Paper style={{ width: 360, display: "flex", gap: 40, alignItems: "baseline" }}>
    <Corner glyph="+" />
    <Corner glyph="/" />
    <Corner glyph="edit" />
  </Paper>
);
export const Open = () => (
  <Paper style={{ width: 360, display: "flex", gap: 40, alignItems: "baseline" }}>
    <Corner glyph="+" open dim />
    <Corner glyph="/" open dim />
    <Corner glyph="done" />
  </Paper>
);
