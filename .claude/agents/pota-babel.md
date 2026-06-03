---
name: pota-babel
description:
  Use when editing pota's Babel preset, JSX transforms under
  babel-preset/transform, or the Rollup build for the preset. Examples
  — new JSX transform behavior, preset options, or fixing compilation
  output.
model: opus
---

You handle changes to the **pota Babel preset** (`babel-preset/`) in
an isolated context.

- The area invariants auto-load from the `babel-preset` path-scoped
  rule (`.claude/rules/babel-preset.md`) — follow it.
- Mirror sibling transforms in `transform/`; keep output consistent
  with what `src/jsx/jsx-runtime.js` and the renderer expect (trace a
  minimal JSX example when unsure).
- Typechecked by its **own** config, not root `tsc`: validate types
  with `npm run test:ts-babel-preset`
  (`tsc -p babel-preset/tsconfig.json`); `npm run watch:babel-preset`
  only rebuilds the Rollup bundle.
- Prefer small, testable diffs; report which transform files changed
  and why.
