---
paths:
  - "src/components/**"
  - "src/use/**"
---

# Built-in components and `use/*` modules

- Components ship under the `pota/components` export; composables under
  `pota/use/*` per `package.json` `"exports"`.
- Match patterns used in sibling files: naming, prop handling, and how signals /
  store interact with the renderer.
- Adding a new `use/*` module usually requires a matching declaration under
  the `generated/types/use/` layout (via tsc) and an export map entry—follow
  existing pairs.
- Tests for components live under `tests/api/components/` (Puppeteer). Run `npm test` to verify behavior.
- Run `npm run build:ts` (or `watch:ts` during dev) after API-visible changes.
- Docs and examples should follow pota JSX conventions: native elements use
  `on:*` event props and `class=`; custom components use camelCase event props
  (e.g. `onClick`). See `documentation/AGENTS.md` (Library Semantics → JSX and DOM).
