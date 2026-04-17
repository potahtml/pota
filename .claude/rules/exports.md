---
paths:
  - "package.json"
  - "src/exports.js"
---

# Package entry and export map

- Public API is defined by **`package.json` `"exports"`** and **`src/exports.js`**.
  Keep them in sync when adding or removing surface area.
- Subpath exports (`./use/*`, `./components`, `./jsx-runtime`, etc.) must stay
  consistent with files on disk and with type entry points (`typescript/`
  directory, `typescript/exports.d.ts`).
- Treat export or entry changes as **breaking** unless you are sure they are
  additive and backward compatible; document in `documentation/` notes when
  appropriate.
