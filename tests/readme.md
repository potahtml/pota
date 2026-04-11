# Test Plan

Track what has tests and what still needs them. Work one section at a
time. Write 1 file at a time.

IMPORTANT: Use JSX directly on all test files because these are
transformed. No need for Component() functions calls.

---

## Notes

- All test files should import helpers from `#test` (aliased to
  `pota/use/test`).
- Tests run in a real Chromium browser (Puppeteer, headed by default).
  DOM APIs are available; `body()` from `pota/use/test` returns
  `document.body.innerHTML`.
- The test harness (`tools/test-runner/test.js`) clears `document.body`,
  `document.head`, and `document.adoptedStyleSheets` before each test,
  and verifies all three are clean after each test. A test that leaves
  DOM behind will fail.
- When using `render`, call the returned `dispose` function at the end
  of the test — the harness asserts the document is empty afterward to
  verify proper node cleanup.
- Use JSX directly on all test files because these are transformed. No
  need for Component() function calls.
- Make sure tests cover every situation possible.
- Before writing each file, think if you would do something better
  and do it.

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

- **`microtask()`** — sufficient for deferred effects, `onProps`,
  `onMount`, `ready`, and scheduler-batched callbacks.
- **`macrotask()`** — needed for `Promise.resolve` chains that go
  through multiple async steps (e.g. `readyAsync`, `action` with
  promises, `CSSStyleSheet.replace()`).
- **`sleep(ms)`** — only for truly time-dependent operations:
  - `history.back()` needs **200ms** (browser-level async, cannot be
    reduced).
  - `navigate()` with `delay` option needs at least 2× the delay
    value.
  - `useTimeout` tests need sleep > timer delay.
- Prefer `microtask` over `macrotask`, and `macrotask` over `sleep`.
- Do not use double `await microtask()` — use a single `await
  macrotask()` instead.
- Namespaced props (`use:*`) registered with `onMicrotask=true` need
  `await microtask()` after `render()`. Built-in props like
  `use:ref`, `use:connected`, `use:disconnected`, `disabled`,
  `class`, `style`, `on:*`, `prop:*` are immediate and do not.

## Current Gaps

- `tests/package.exports.js` is not currently present in the tree, so
  export-surface coverage should not be considered complete until that
  file is restored or replaced.
- Main remaining behavioral gap is `babel-preset` tooling coverage.
- `map()` direct fallback usage (without `For`) is commented out —
  the fallback cleanup mechanism doesn't work outside `For`.

All test file paths below are relative to `tests/api/`.

Legend: [x] done · [ ] todo · [-] skip (untestable / out of scope)

---

## `pota/components`

| Export                           | Test file                       | Status |
| -------------------------------- | ------------------------------- | ------ |
| `Collapse`                       | `components/collapse.jsx`       | [x]    |
| `CustomElement`, `customElement` | `components/custom-element.jsx` | [x]    |
| `Dynamic`                        | `components/dynamic.jsx`        | [x]    |
| `For`                            | `components/for.jsx`            | [x]    |
| `Head`                           | `components/head.jsx`           | [x]    |
| `Normalize`                      | `components/normalize.jsx`      | [x]    |
| `Portal`                         | `components/portal.jsx`         | [x]    |
| `Range`                          | `components/range.jsx`          | [x]    |
| `A`, `load`, `Navigate`, `Route` | `components/route.jsx`          | [x]    |
| `Show`                           | `components/show.jsx`           | [x]    |
| `Suspense`                       | `components/suspense.jsx`       | [x]    |
| `Match`, `Switch`                | `components/switch.jsx`         | [x]    |
| `Tabs`                           | `components/tabs.jsx`           | [x]    |

---

## Package export surface

| Export area                                                                                                   | Test file            | Status |
| ------------------------------------------------------------------------------------------------------------- | -------------------- | ------ |
| `pota`, `pota/components`, `pota/store`, `pota/xml`, `pota/jsx-runtime`, `pota/jsx-dev-runtime`, `pota/use/*` | `package.exports.js` | [ ]    |
| `pota/babel-preset`                                                                                           | tooling test         | [ ]    |

---

## `pota` (main export)

### Reactivity

| Export           | Test file                | Status |
| ---------------- | ------------------------ | ------ |
| `signal`         | `exports/reactivity.jsx` | [x]    |
| `memo`           | `exports/reactivity.jsx` | [x]    |
| `derived`        | `exports/reactivity.jsx` | [x]    |
| `effect`         | `exports/reactivity.jsx` | [x]    |
| `syncEffect`     | `exports/reactivity.jsx` | [x]    |
| `asyncEffect`    | `exports/reactivity.jsx` | [x]    |
| `batch`          | `exports/reactivity.jsx` | [x]    |
| `untrack`        | `exports/reactivity.jsx` | [x]    |
| `on`             | `exports/reactivity.jsx` | [x]    |
| `root`           | `exports/reactivity.jsx` | [x]    |
| `owned`          | `exports/reactivity.jsx` | [x]    |
| `cleanup`        | `exports/reactivity.jsx` | [x]    |
| `context`        | `exports/context.jsx`    | [x]    |
| `action`         | `exports/reactivity.jsx` | [x]    |
| `externalSignal` | `exports/reactivity.jsx` | [x]    |
| `map`            | `exports/reactivity.jsx` | [x]    |
| `resolve`        | `exports/reactivity.jsx` | [x]    |
| `unwrap`         | `exports/reactivity.jsx` | [x]    |
| `isResolved`     | `exports/reactivity.jsx` | [x]    |
| `ref`            | `exports/reactivity.jsx` | [x]    |
| `withValue`      | `exports/reactivity.jsx` | [x]    |
| `getValue`       | `exports/reactivity.jsx` | [x]    |

### Renderer

| Export      | Test file         | Status |
| ----------- | ----------------- | ------ |
| `render`    | `exports/dom.jsx` | [x]    |
| `insert`    | `exports/dom.jsx` | [x]    |
| `toHTML`    | `exports/dom.jsx` | [x]    |
| `Component` | `exports/dom.jsx` | [x]    |

### Scheduler / DOM ready

| Export       | Test file         | Status |
| ------------ | ----------------- | ------ |
| `ready`      | `exports/dom.jsx` | [x]    |
| `readyAsync` | `exports/dom.jsx` | [x]    |

### Events

| Export        | Test file         | Status |
| ------------- | ----------------- | ------ |
| `addEvent`    | `exports/dom.jsx` | [x]    |
| `removeEvent` | `exports/dom.jsx` | [x]    |

### Props

| Export          | Test file         | Status |
| --------------- | ----------------- | ------ |
| `setAttribute`  | `exports/dom.jsx` | [x]    |
| `setProperty`   | `exports/dom.jsx` | [x]    |
| `setStyle`      | `exports/dom.jsx` | [x]    |
| `setClass`      | `exports/dom.jsx` | [x]    |
| `setClassList`  | `exports/dom.jsx` | [x]    |
| `propsPlugin`   | `exports/dom.jsx` | [x]    |
| `propsPluginNS` | `exports/dom.jsx` | [x]    |

### Component utilities

| Export          | Test file         | Status |
| --------------- | ----------------- | ------ |
| `isComponent`   | `exports/dom.jsx` | [x]    |
| `makeCallback`  | `exports/dom.jsx` | [x]    |
| `markComponent` | `exports/dom.jsx` | [x]    |
| `Pota`          | `exports/dom.jsx` | [x]    |

### Version

| Export    | Test file      | Status |
| --------- | -------------- | ------ |
| `version` | trivial string | [-]    |

### Internal std helpers

| Export area                         | Test file                   | Status |
| ----------------------------------- | --------------------------- | ------ |
| selected `src/lib/std.js` utilities | `exports/miscellaneous.jsx` | [x]    |

### JSX built-in props

| Export area                         | Test file               | Status |
| ----------------------------------- | ----------------------- | ------ |
| `use:ref`                           | `exports/dom.jsx`       | [x]    |
| `use:connected`, `use:disconnected` | `exports/framework.jsx` | [x]    |
| `use:css`                           | `exports/dom.jsx`       | [x]    |

### Framework integration

| Export area                                  | Test file               | Status |
| -------------------------------------------- | ----------------------- | ------ |
| framework-level JSX/reconciliation scenarios | `exports/framework.jsx` | [x]    |
| transform / JSX output scenarios             | `transform.jsx`         | [x]    |
| SVG, MathML, foreignObject namespaces        | `exports/framework.jsx` | [x]    |
| createPartial (JSX runtime)                  | `exports/framework.jsx` | [x]    |

### Framework expectations / invariants

| Export area                                        | Test file          | Status |
| -------------------------------------------------- | ------------------ | ------ |
| immediate timing, prop semantics, and gotcha cases | `expectations.jsx` | [x]    |

### Reactive tracking behavior

| Export area                                                    | Test file                | Status |
| -------------------------------------------------------------- | ------------------------ | ------ |
| `() =>` wrapped vs unwrapped in Show, Switch, For, all others | `component-tracking.jsx` | [x]    |

### Native HTML behavior

| Export area                                                       | Test file   | Status |
| ----------------------------------------------------------------- | ----------- | ------ |
| form reset (all input types), label association, fieldset          | `forms.jsx` | [x]    |
| details/summary, progress/meter, template, select multiple        | `forms.jsx` | [x]    |
| reactive value/checked/selected/disabled/required/pattern/min/max | `forms.jsx` | [x]    |
| validity API, input type switching, datalist, form.elements       | `forms.jsx` | [x]    |
| focus/blur events, selection range, optgroup, spellcheck/wrap     | `forms.jsx` | [x]    |
| aria attributes (string values, not boolean), role                | `forms.jsx` | [x]    |

---

## `pota/use/*`

Notes:

- Pure utility modules should get direct behavior tests that cover all
  exported functions.
- Plugin-only modules should still have their own files and be tested
  through JSX usage after importing the side-effect module.
- Browser API heavy modules may need partial coverage with local stubs
  for unsupported platform pieces.

| Module             | Test file              | Status |
| ------------------ | ---------------------- | ------ |
| `use/animate`      | `use/animate.jsx`      | [x]    |
| `use/bind`         | `use/bind.jsx`         | [x]    |
| `use/browser`      | `use/browser.jsx`      | [x]    |
| `use/clickoutside` | `use/clickoutside.jsx` | [x]    |
| `use/clipboard`    | `use/clipboard.jsx`    | [x]    |
| `use/color`        | `use/color.jsx`        | [x]    |
| `use/css`          | `use/css.jsx`          | [x]    |
| `use/dom`          | `use/dom.jsx`          | [x]    |
| `use/emitter`      | `use/emitter.jsx`      | [x]    |
| `use/event`        | `use/event.jsx`        | [x]    |
| `use/focus`        | `use/focus.jsx`        | [x]    |
| `use/form`         | `use/form.jsx`         | [x]    |
| `use/fullscreen`   | `use/fullscreen.jsx`   | [x]    |
| `use/location`     | `use/location.jsx`     | [x]    |
| `use/orientation`  | `use/orientation.jsx`  | [x]    |
| `use/paginate`     | `use/paginate.jsx`     | [x]    |
| `use/random`       | `use/random.jsx`       | [x]    |
| `use/resize`       | `use/resize.jsx`       | [x]    |
| `use/scroll`       | `use/scroll.jsx`       | [x]    |
| `use/selection`    | `use/selection.jsx`    | [x]    |
| `use/selector`     | `use/selector.jsx`     | [x]    |
| `use/stream`       | `use/stream.jsx`       | [x]    |
| `use/string`       | `use/string.jsx`       | [x]    |
| `use/test`         | `use/test.jsx`         | [x]    |
| `use/time`         | `use/time.jsx`         | [x]    |
| `use/url`          | `use/url.jsx`          | [x]    |
| `use/visibility`   | `use/visibility.jsx`   | [x]    |

---

## `pota/xml`

| Export       | Test file         | Status |
| ------------ | ----------------- | ------ |
| XML renderer | `exports/xml.jsx` | [x]    |

---

## `pota/store`

| Export            | Test file         | Status |
| ----------------- | ----------------- | ------ |
| `signalify`       | `store/store.jsx` | [x]    |
| `mutable`         | `store/store.jsx` | [x]    |
| `merge`           | `store/store.jsx` | [x]    |
| `replace`         | `store/store.jsx` | [x]    |
| `reset`           | `store/store.jsx` | [x]    |
| `updateBlacklist` | `store/store.jsx` | [x]    |
| `firewall`        | `store/store.jsx` | [x]    |
| `project`         | `store/store.jsx` | [x]    |
| `copy`            | `store/store.jsx` | [x]    |
| `readonly`        | `store/store.jsx` | [x]    |
