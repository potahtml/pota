---
paths:
  - 'src/core/**'
  - 'src/lib/**'
---

# Core runtime and reactive library

- `src/core/` owns rendering, scheduling, XML, and the props pipeline;
  `src/lib/` holds reactive primitives, store, and Solid-related
  compatibility code.
- Hot paths matter: prefer changes that preserve existing allocation
  and scheduling patterns unless profiling or the task explicitly
  calls for a redesign.
- Use `npm run build:ts` (or `watch:ts` during dev) after edits that
  affect types or JSDoc-checked surfaces.
- `src/lib/solid.js` is substantial; treat it as a compatibility
  layer—mirror Solid semantics only where pota intentionally aligns,
  and document behavioral differences in code comments when
  non-obvious.
- Signal shape: object form `const s = signal()` with `s.read()`,
  `s.write(value)`, `s.update(prev => next)` is the preferred API for
  new code. The return value is also a `[read, write, update]` tuple
  for backwards compatibility, but tuple destructuring is being phased
  out — migrate when you touch surrounding code. `write` does not
  receive the previous value; `update` does. See
  `documentation/AGENTS.md` (Library Semantics → Signals).
