---
paths:
  - 'package.json'
  - 'src/exports.js'
---

# Package entry and export map

- Public API is defined by **`package.json` `"exports"`** and
  **`src/exports.js`**. Keep them in sync when adding or removing
  surface area.
- Subpath exports (`./use/*`, `./components`, `./jsx-runtime`, etc.)
  must stay consistent with files on disk. Type entry points are
  **split**: only `.` points `"types"` at the hand-maintained
  `typescript/exports.d.ts`; most subpaths (`./components`, `./store`,
  `./xml`, `./use/*`) resolve `"types"` to tsc-emitted
  `generated/types/**` — check the matching `"types"` field for the
  one you touch; don't hand-author a `.d.ts` in `typescript/`.
- Adding a subpath needs the `src/` file plus an `"exports"` entry
  with correct `"types"` / `"default"` — **except** `src/use/*.js`,
  which the `./use/*` wildcard exports automatically (no
  `package.json` edit).
- Treat export or entry changes as **breaking** unless you are sure
  they are additive and backward compatible; document in
  `documentation/` notes when appropriate.
