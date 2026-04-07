# Pota Agent Notes

This repository contains `pota`, a small reactive web renderer with a
Solid-inspired reactive core, a custom JSX transform, a compiler-less
`xml` tagged-template API, built-in UI components, and a store layer
based on signalified objects and proxies.

## Start Here

- `src/exports.js`: main public export map for `pota`
- `src/lib/reactive.js`: public reactive helpers layered on top of
  `createReactiveSystem()` from `src/lib/solid.js`
- `src/core/renderer.js`: DOM creation, rendering, JSX runtime
  helpers, partial instantiation
- `src/core/props/@main.js`: prop dispatch and plugin registration
- `src/components/`: built-in components (`Route`, `Suspense`,
  `CustomElement`, etc.)
- `src/use/`: public utilities exposed as `pota/use/*`
- `src/babel-preset/transform/`: custom JSX compiler internals

## Project Reality

- Source is plain ESM JavaScript with heavy JSDoc typing, not
  TypeScript source files.
- Formatting is defined in `package.json`: tabs, no semicolons, single
  quotes, trailing commas, ~70 column prose/code style.
- Default DOM semantics are attribute-first, not property-first.
  `prop:*`, `on:*`, `use:*`, `style`, and `class` are handled by the
  props plugin layer.
- The project is intentionally pre-1.0, types are still in progress,
  and SSR is explicitly out of scope.

## Behavior Conventions

- Prefer derivation (`memo`, `derived`, `resolve`) over manual
  synchronization via `effect`.
- In JSX, pass reactive functions directly as children when possible:
  `{count}` rather than `{count()}`.
- For native elements, events use namespaced props such as
  `on:click={...}`. For component props, the codebase also uses plain
  camelCase callback props when the component defines them.
- Use `class`, not `className`.
- `src/release/llm.md` documents API conventions and the full export
  listing. When in doubt, verify against current source.

## Tests

- `vitest.config.js` runs browser tests in Chromium through
  Playwright.
- Tests are `.jsx` files transformed with the local Babel preset.
- `tests/api/index.js` clears `document.body` around each test and
  asserts cleanup, so renderer changes should preserve proper node
  disposal.
- `tests/AGENTS.md` is the current coverage map and also documents
  test writing conventions.

## Change Heuristics

- If you touch `src/core/renderer.js`, also inspect affected built-in
  components and the JSX transform output paths.
- If you touch `src/core/props/` or `src/use/dom.js`, verify DOM
  behavior and attribute/property semantics first.
- If you touch `src/lib/reactive.js`, `src/lib/solid.js`, or
  `src/lib/store/`, verify ownership, cleanup, and proxy/reactivity
  behavior.
- If you touch routing or navigation, read both
  `src/components/route/` and `src/use/location.js`; they are coupled.

## Deeper Notes

- `.claude/CLAUDE.md`: project instructions and conventions
- `src/release/llm.md`: API reference and usage conventions
- `tests/AGENTS.md`: test coverage map and testing conventions
