---
paths:
  - "src/jsx/**"
  - "typescript/**"
  - "tests/typescript/**"
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

- For multi-signature functions, prefer **`@type` with an
  intersection of call signatures** over multiple `@overload` blocks
  (matches `Match`, `For`, `Range` in `src/components/`). Order the
  intersection's signatures: strictest first (call-site resolution
  is top-down), broadest/preferred-inference last (structural
  matching uses the last). Full rationale and examples in
  `documentation/typescript.md` (Overload ordering, Generic-preserving
  overloads on `Component()`, `@type` intersection over `@overload`
  blocks).
- When adding type-level tests under `tests/typescript/`: component
  utility types (`Component`, `ParentComponent`, `VoidComponent`,
  `FlowComponent`, `ComponentType`, `Children`) belong in
  `jsx.tsx`. `types.tsx` is reserved for structural utilities
  (`Accessor`, `Accessed`, `When`, `Each`, `Merge`, `ComponentProps`,
  primitive JSX types). See `documentation/typescript.md`
  (Verification Checklist) for the per-file split.
