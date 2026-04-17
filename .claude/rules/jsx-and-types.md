---
paths:
  - "src/jsx/**"
  - "typescript/**"
---

# JSX runtime and type surfaces

- `src/jsx/jsx-runtime.js` is the runtime; `typescript/jsx/namespace.d.ts` is
  large and hand-maintained. Prefer **small, local** changes; avoid wholesale
  reformatting or renaming that churns thousands of lines.
- Root and subpath types also flow from `typescript/exports.d.ts` and
  `package.json` `"exports"`. If you add or rename a public type surface,
  reconcile **exports**, **runtime**, and **aggregate `.d.ts`** together.
- After edits, run `npm run watch:ts` and fix new diagnostics in touched areas.
- Align with type rules in `documentation/AGENTS.md` (Library Semantics → TypeScript
  and JSDoc): no `any` or
  `@ts-ignore`-style suppression; prefer proper types or the JSDoc cast form
  `(/* @type {T} */ (value))` when a cast is truly needed.
