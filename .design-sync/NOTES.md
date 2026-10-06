# design-sync notes

- The site itself is Next.js pages + global CSS, not a component library. The synced design system is the small package in `ds/` (`yeoziphab-ds`): tokens + 14 patterns extracted from `src/app/globals.css`. Keep `ds/src/styles.css` in step with `globals.css` when tokens or row/rail/field/veil rules change.
- Build: `cd ds && node build.mjs` (esbuild from `.ds-sync/node_modules`, then `tsc` for `.d.ts`). Converter runs from the repo root with `--entry ./ds/dist/index.js --node-modules ./node_modules`.
- Fonts are remote (`[FONT_REMOTE]`): Pretendard via jsDelivr, Noto Serif KR via Google Fonts, both `@import`ed from `ds/src/styles.css`. Nothing to ship.
- Render check: playwright 1.62.0 (pins the cached chromium-1234) installed in `.ds-sync/`.
- Known render warns: none after authoring; `[GRID_OVERFLOW]` on Corner/Field/Month/Note/Rail/Row/Veil fixed with `cardMode: column` overrides.
- All 14 previews are authored in `.design-sync/previews/` and graded good (2026-10-06).

## Re-sync risks

- `ds/src/styles.css` is a hand copy of the site's tokens; if `globals.css` changes, the DS drifts silently until someone diffs them.
- The DS has no tests; `tsc` is the only gate on the package.
