# yeoziphab — 종이 한 장, 먹 한 색

Every screen is one sheet of paper with ink on it. Three colors only, one typeface, hierarchy by size and spacing, never by weight, boxes, shadows, icons, or accent colors.

## Setup

Wrap every design in `<Paper>` — it paints the paper background (`--paper`), sets Pretendard and the ink color. Nothing else is needed; there is no theme provider.

```tsx
import { Paper, Rail, Note, Tags, Corner, Month, Row } from "yeoziphab-ds";

<Paper style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 640px 1fr" }}>
  <Rail name="yeoziphab" routes={["/archive", "/write", "/portfolio"]} active="/archive">
    <Note>정리되지 않은 것 7</Note>
    <div style={{ marginTop: 28 }}><Tags tags={["전체", "글", "디자인"]} active="전체" /></div>
  </Rail>
  <div>
    <Month label="2026년 8월">
      <Row title="종이는 왜 따뜻하게 느껴지는가" metas={[{ text: "brunch.co.kr", serif: true }, { text: "글" }, { text: "8. 29", serif: true }]} />
    </Month>
  </div>
  <div style={{ textAlign: "right" }}><Corner glyph="+" /> <Corner glyph="/" /></div>
</Paper>
```

## Layout rules

- Three columns: left margin (rail at 72px from the edge), a 640px body, right margin (hover previews live there). The body is the only thing that scrolls.
- Rail = name, the three routes, then page-specific items (`Note`, `Tags`). Corner glyphs `+` (add) and `/` (search) sit at the top right; `edit`/`done` is a small serif word, not an icon.
- Lists are `Month` groups of `Row`s. A row is title left, small metas right; domains and dates are serif (`serif: true`), tags are sans with letter-spacing. Hover darkens the row and grows a 22px line to its left.
- Inputs are a single underline (`Field` size `lg` 20px for links/search, `md` 15px for memos, `sm` 13px for tags). Buttons are words: `LinkButton` (underline appears on hover) for primary actions, `Hint` (tiny serif, e.g. "Esc 로 닫기") for secondary ones. No filled buttons.
- Anything modal is a `Veil`: the page behind blurs under a translucent paper wash and a 640px sheet rises 6px into place. Put the `Veil` inside the `Paper` it covers.
- Reading screens: `Heading` (30px title, 15px subtitle at 60% ink, serif meta line), then `Paragraph`s at 15px / 2.05 line height. CV blocks are `CvSection` (serif label, hairline, name · description · period rows).

## Styling idiom

Style your own glue with the tokens from `_ds/yeoziphab/styles.css` (`@import`s `_ds_bundle.css`): `var(--paper)`, `var(--paper-deep)` (image placeholders), `var(--ink)`, `var(--ink-soft)` / `--ink-60` / `--ink-55` / `--ink-50` / `--ink-45` / `--ink-42` / `--ink-38` / `--ink-35` (secondary text is ink at an opacity, never a new color), `var(--line)` for hairlines, `var(--sans)` / `var(--serif)`, `var(--ease)` for the 0.25–0.35s transitions. Class names on the components are `yz-*` and are not meant to be composed by hand; reach for the component or the tokens.

Motion is minimal: fade/rise of 3px on load (`yz-rise`), `/` tilts 10° on hover and 24° when open, `+` turns 45° into a close mark. Nothing bounces.
