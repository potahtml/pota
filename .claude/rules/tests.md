---
paths:
  - 'tests/**'
---

# Tests

- `tests/readme.md` is the contract for this tree: writing/fixing
  conventions, the `microtask`/`macrotask`/`sleep` timing rules, and
  the per-area coverage inventory. Read the relevant sections before
  writing or changing tests; the `writing-tests` skill walks through
  adding coverage end to end.
- Adding, renaming, or removing a test file updates its matching
  inventory row in `tests/readme.md`.
- `tests/typescript/*.tsx` are typecheck-only — no `test()` calls, no
  runtime assertions; they pass when `npm run test:ts-tests` compiles
  clean. The browser runner does not discover them.
