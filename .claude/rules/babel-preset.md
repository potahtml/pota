---
paths:
  - "babel-preset/**"
---

# Babel preset and build

- This tree lives outside `src/` (it is a subpackage at the repo root) and is
  not typechecked by `tsc`. Behavior is validated by how consumers compile JSX
  and by the Rollup build.
- Entry points: `babel-preset/babel-preset.js` (compiled to `generated/babel-preset.cjs`);
  transforms live under `babel-preset/transform/`. Follow existing patterns in
  sibling transforms (`partial`, `props`, `html`, etc.) instead of inventing a
  new style.
- After substantive changes, run `npm run watch:babel-preset` (or `npm run dev`) from the
  repo root. Rollup uses `tools/babel-preset/rollup.config.js` and writes to
  `generated/babel-preset.cjs`.
- Never commit anything under `generated/` — the entire tree is gitignored.
