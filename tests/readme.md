# Test Plan

Track what has tests and what still needs them. Work one section at a
time. Write 1 file at a time.

---

## Notes

- All test files should import helpers from `#test` (aliased to
  `pota/use/test`).
- Tests run in a real Chromium browser (Puppeteer, headed by default).
  DOM APIs are available; `body()` from `pota/use/test` returns
  `document.body.innerHTML`.
- The test harness (`tools/test-runner/test.js`) clears
  `document.body`, `document.head`, and `document.adoptedStyleSheets`
  before each test, and verifies all three are clean after each test.
  A test that leaves DOM behind will fail.
- When using `render`, call the returned `dispose` function at the end
  of the test — the harness asserts the document is empty afterward to
  verify proper node cleanup.
- Use JSX directly in test files (they are transformed) — no
  `Component()` calls needed.
- Make sure tests cover every situation possible.
- Before writing each file, think if you would do something better and
  do it.

## Agent Notes

- Prefer one-file ownership. Finish reading source, editing, and
  tightening assertions for one file before moving to the next.
- Before marking a row as done, verify the file actually exists in
  `tests/` and the row points to the real path.
- Prefer exact output assertions (`toBe('...')`) when the output is
  stable enough. Use narrower DOM assertions only when browser
  serialization is likely to vary.
- Do not introduce helper mini-frameworks inside test files. Inline
  the setup unless a tiny helper is clearly unavoidable.
- If a test file covers framework invariants or internal utilities
  rather than package exports, keep it listed in a dedicated section
  instead of pretending it maps 1:1 to public exports.

## Rules For Fixing Tests

- Do not cheat the tests. The goal is to verify real behavior, not to
  make failures disappear.
- Do not use `try` / `catch` or `try` / `finally` in test bodies to
  hide assertion failures or force cleanup after a broken expectation.
- Keep the essence of the original test intact. If a test is being
  corrected, preserve the original scenario and intention unless the
  source code proves that the scenario itself is invalid.
- Do not rewrite a clear, intentional test into a narrower or
  different scenario just because the current implementation is buggy.
  A failing test may be exposing a real framework bug. Report that
  distinction clearly before changing the test.
- Only change a test when there is a strong reason to believe the test
  is flawed. Prefer reading the implementation first and adjusting the
  expectation to match real behavior.
- To demonstrate an alternative assertion or expose a coverage gap,
  add a new test alongside the existing one instead of rewriting it.
- Do not weaken a test just to make it pass. Avoid replacing a strong
  assertion with a vague one unless browser serialization or platform
  behavior genuinely makes the stronger assertion unreliable.
- If you cannot confidently fix a failing test, leave the test logic
  as close as possible to the original and add a short comment inside
  the body of that specific test function explaining what seems
  unclear, surprising, or framework-dependent.
- Comments added for this purpose should be factual and specific. They
  should explain what is uncertain and why the test was left as-is.

## Timing Considerations

Rule of thumb — prefer `microtask` over `macrotask` over `sleep`:

- **`await microtask()`** — flushes the full scheduler priority queue.
  Enough for `onProps`, `onMount`, `ready`, lifecycle plugins, and any
  callback routed through the scheduler's `add(...)`.
- **`await macrotask()`** — needed when promises chain through more
  than one microtask tick (`readyAsync`, `action` promise chains,
  `CSSStyleSheet.replace()`). Do not use a double `await microtask()`;
  use a single `await macrotask()`.
- **`sleep(ms)`** — only for truly time-dependent browser APIs
  (`history.back()` needs ~200ms, `navigate({delay})` needs ≥2×delay,
  `useTimeout` tests need `sleep > timer delay`).

Namespaced props (`use:*`) registered with the default
`onMicrotask=true` need `await microtask()` after `render()` before
their effect is observable. Built-in props registered with
`onMicrotask=false` (`use:ref`, `use:connected`, `use:disconnected`,
`style`, `class`, `on:*`, `prop:*`) apply immediately.

## Current Gaps

- Main remaining behavioral gap is `babel-preset` tooling coverage
  beyond the 12-check smoke test in `tools/babel-preset/test/`.
- `map()` direct fallback usage (without `For`) is commented out — the
  fallback cleanup mechanism doesn't work outside `For`.

All test file paths below are relative to `tests/api/` unless noted.

---

## Layout at a glance

```
tests/
  api/                      browser tests, discovered by the runner
    components/             one file per built-in component
    reactivity/             one file per reactive primitive
    dom/                    renderer, refs, props, events
    forms/                  native HTML form behavior
    jsx/                    JSX transform + tracking semantics
    store/                  one file per `pota/store` export
    use/                    one file per `pota/use/*` module
    console-formatting.jsx  test-runner capture pipeline
    std.jsx                 selected `src/lib/std.js` utilities
    xml.jsx                 `pota/xml` tagged-template renderer
  typescript/               typecheck-only (.tsx), run via `npm run test:ts-tests`
```

The Puppeteer runner discovers everything under `tests/api/` that
matches `.jsx`/`.tsx`/`.ts` (except `.d.ts`). No registration step.

---

## `tests/api/components/` — built-in components

| File                 | Covers                           |
| -------------------- | -------------------------------- |
| `a.jsx`              | `A` anchor component from route  |
| `collapse.jsx`       | `Collapse`                       |
| `custom-element.jsx` | `CustomElement`, `customElement` |
| `dynamic.jsx`        | `Dynamic`                        |
| `errored.jsx`        | `Errored`                        |
| `for.jsx`            | `For`                            |
| `head.jsx`           | `Head`                           |
| `load.jsx`           | `load()` from route              |
| `navigate.jsx`       | `Navigate`                       |
| `normalize.jsx`      | `Normalize`                      |
| `portal.jsx`         | `Portal`                         |
| `range.jsx`          | `Range`                          |
| `route.jsx`          | `Route`                          |
| `show.jsx`           | `Show`                           |
| `suspense.jsx`       | `Suspense`                       |
| `switch.jsx`         | `Match`, `Switch`                |
| `tabs.jsx`           | `Tabs` and sub-components        |

## `tests/api/reactivity/` — reactive primitives

| File                            | Covers                                                                                                                                               |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action.jsx`                    | `action`                                                                                                                                             |
| `batch.jsx`                     | `batch`                                                                                                                                              |
| `catch-error.jsx`               | `catchError` (also exercises cleanup-error routing)                                                                                                  |
| `cleanup.jsx`                   | `cleanup` + throwing-cleanup routing                                                                                                                 |
| `context.jsx`                   | `context` / Provider / `walk`                                                                                                                        |
| `derived.jsx`                   | `derived` — primitive semantics, promise / array handling, `lastWrite` token                                                                         |
| `derived-chain-current.jsx`     | multi-stage chain baselines                                                                                                                          |
| `derived-chain-expected.jsx`    | per-stage re-run + user-write override (run explicitly: `npm run test:api -- derived-chain-expected`)                                                |
| `effect.jsx`                    | `effect`                                                                                                                                             |
| `external-signal.jsx`           | `externalSignal`                                                                                                                                     |
| `map.jsx`                       | `map`                                                                                                                                                |
| `memo.jsx`                      | `memo` (incl. the phantom-property inference fix)                                                                                                    |
| `on.jsx`                        | `on`                                                                                                                                                 |
| `owned.jsx`                     | `owned` + `runWithOwner` error routing                                                                                                               |
| `resolve.jsx`                   | `resolve`                                                                                                                                            |
| `root.jsx`                      | `root`                                                                                                                                               |
| `signal.jsx`                    | `signal` tuple / object shape, `equals` options                                                                                                      |
| `signal-write-during-mount.jsx` | regression: signal write inside a child mounted via reactive update reaches long-lived subscribers (incl. popstate-driven `<Head>` + `<Route>` case) |
| `sync-effect.jsx`               | `syncEffect`                                                                                                                                         |
| `untrack.jsx`                   | `untrack`                                                                                                                                            |
| `unwrap.jsx`                    | `unwrap`                                                                                                                                             |
| `with-value.jsx`                | `withValue`                                                                                                                                          |

## `tests/api/dom/` — renderer, props, events

| File                    | Covers                                                              |
| ----------------------- | ------------------------------------------------------------------- |
| `component.jsx`         | `Component`, `isComponent`, `makeCallback`, `markComponent`, `Pota` |
| `events.jsx`            | `addEvent` / `removeEvent`, event delegation                        |
| `helpers.jsx`           | DOM test helpers themselves                                         |
| `namespaces.jsx`        | SVG / MathML / foreignObject                                        |
| `partials.jsx`          | `createPartial` runtime                                             |
| `reactive-children.jsx` | reactive text/children semantics                                    |
| `ready.jsx`             | `ready`, `readyAsync`, scheduler priorities                         |
| `refs.jsx`              | `use:ref`, `ref()`                                                  |
| `render.jsx`            | `render`, `insert`, `toHTML`                                        |
| `set-attribute.jsx`     | `setAttribute`                                                      |
| `set-class.jsx`         | `setClass`, `setClassList`, `class:*`                               |
| `set-property.jsx`      | `setProperty`, `prop:*`                                             |
| `set-style.jsx`         | `setStyle`, `style:*`                                               |
| `special-children.jsx`  | empty fragments, boolean / null children                            |
| `use-css.jsx`           | `use:css`                                                           |

## `tests/api/forms/` — native HTML form behavior

| File                      | Covers                                                    |
| ------------------------- | --------------------------------------------------------- |
| `attributes.jsx`          | form / field attribute defaults                           |
| `elements.jsx`            | `form.elements`, fieldset, label association              |
| `events.jsx`              | focus / blur / input / change flows                       |
| `reactive-attributes.jsx` | signals driving disabled / required / pattern / min / max |
| `reactive-fields.jsx`     | reactive value / checked / selected                       |
| `reset.jsx`               | form reset semantics across input types                   |
| `validity.jsx`            | validity API, `setCustomValidity`                         |

## `tests/api/jsx/` — JSX transform and tracking

| File                     | Covers                                                  |
| ------------------------ | ------------------------------------------------------- |
| `children.jsx`           | children shapes, fragments, arrays                      |
| `component-tracking.jsx` | `() =>` wrapped vs unwrapped in Show / Switch / For     |
| `transform.jsx`          | Babel preset output — partials, event hoisting, spreads |

## `tests/api/store/` — reactive store

| File                  | Covers              |
| --------------------- | ------------------- |
| `copy.jsx`            | `copy`, `readonly`  |
| `merge.jsx`           | `merge` reconcile   |
| `mutable.jsx`         | `mutable`           |
| `project.jsx`         | `project`           |
| `readonly.jsx`        | `readonly`          |
| `replace.jsx`         | `replace` reconcile |
| `reset.jsx`           | `reset` reconcile   |
| `signalify.jsx`       | `signalify`         |
| `updateBlacklist.jsx` | `updateBlacklist`   |

## `tests/api/use/` — `pota/use/*`

One file per module under `src/use/`. Each imports from `#test` and
the matching `pota/use/<name>` subpath.

## Top-level tests

| File                     | Covers                                                  |
| ------------------------ | ------------------------------------------------------- |
| `console-formatting.jsx` | test-runner pack/unpack pipeline across console methods |
| `std.jsx`                | selected `src/lib/std.js` utilities                     |
| `xml.jsx`                | `pota/xml` tagged-template renderer + `XML()` factory   |

## `tests/typescript/` — typecheck-only tests

Run via `npm run test:ts-tests` (`tsc -p tests/tsconfig.json`).
Per-file split: `jsx.tsx` (intrinsic elements, attributes, events,
`prop:*`/`on:*`/`use:*`, and component utility types), `types.tsx`
(structural utilities only — `Accessor`, `When`, `Each`, `Merge`,
`ComponentProps`, primitive JSX types), plus `components.tsx`,
`reactive.tsx`, `store.tsx`, `utility.tsx`, `use.tsx`.

---

## Babel preset tests

Not discovered by the main runner. Run via
`npm run test:babel-preset`. Sources under `tools/babel-preset/test/`;
see `tools/babel-preset/readme.md`.
