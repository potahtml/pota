---
name: writing-tests
description:
  Write or extend pota's own tests — browser tests under tests/api/
  and typecheck-only tests under tests/typescript/. Use when adding
  coverage for a component, reactive primitive, prop, store, or use/*
  module, when writing a regression test for a bug, or when improving
  existing test files. Covers file placement, the test-harness
  contract, timing rules, and how to run the suite.
---

# Writing tests for pota

Tests run in a real Chromium browser via the custom Puppeteer runner
(architecture and the full `#test` helper contract:
`tools/test-runner/readme.md`). Conventions, timing rules, and the
coverage inventory live in `tests/readme.md`. This skill is the
procedure for adding coverage.

## Procedure

1. **Read the source first.** Find the unit's real signature and
   behavior in `src/` — never test from memory of a similar API.
2. **Place the file** mirroring `src/`: `tests/api/components/` for
   built-in components, `reactivity/` for primitives, `dom/` for
   renderer/props/events, `store/`, `use/` (one file per `pota/use/*`
   module), `forms/` for native form behavior, `jsx/` for transform
   and tracking semantics. Type-level assertions go in
   `tests/typescript/*.tsx` instead (typecheck-only,
   `npm run test:ts-tests`).
3. **Write the tests** (anatomy below), one file at a time. Cover the
   behaviors the source actually shows, including edge cases.
4. **Run filtered, then full**:
   `npm run test:api -- <path-substring>`, then `npm run test:api`.
5. **Update the inventory** — the matching table row in
   `tests/readme.md`.
6. **If a test you wrote fails**, don't delete, weaken, or rewrite it
   to pass. Surface the failing assertion, the observed behavior, and
   a hypothesis — it may be a real library bug (see Workflow in
   `documentation/AGENTS.md`). To demonstrate an alternative
   expectation, add a new test alongside the existing one.

## Anatomy

```jsx
/** @jsxImportSource pota */
// Tests for the Show component: static truthy/falsy, signal
// toggling, fallback.
import { test, body, microtask } from '#test'

import { render, signal } from 'pota'
import { Show } from 'pota/components'

await test('Show - renders children when `when` is true', expect => {
	const dispose = render(
		<Show when={true}>
			<p>hello</p>
		</Show>,
	)
	expect(body()).toBe('<p>hello</p>')

	dispose()
})

await test('Show - signal: toggles from true to false', expect => {
	const visible = signal(true)
	const dispose = render(
		<Show
			when={visible.read}
			fallback={<p>fallback</p>}
		>
			<p>hello</p>
		</Show>,
	)
	expect(body()).toBe('<p>hello</p>')
	visible.write(false)
	expect(body()).toBe('<p>fallback</p>')

	dispose()
})
```

- Files start with the `@jsxImportSource pota` pragma and a 1–3 line
  comment saying what the file covers.
- Tests are top-level `await test(title, fn)` calls, run sequentially
  in file order; the harness reports automatically — no `run()` call,
  no registration step, no build step before running.
- `fn` receives `expect` (`toBe`, `toEqual`, `not.*`). Prefer exact
  output assertions (`expect(body()).toBe('…')`) when browser
  serialization is stable.
- **Call the `dispose` returned by `render` at the end of the test.**
  The harness asserts a clean document around every test, so a leaked
  node fails the _next_ test — this doubles as a disposal-leak check.
- No `try`/`catch` around assertions, no helper mini-frameworks —
  inline the setup.

## Timing

Signal writes update the DOM **synchronously** — assert right after
the write, no `await` needed (see the toggle test above). When an
`await` is needed, prefer `microtask()` over `macrotask()` over
`sleep(ms)` — the ladder and the cases each covers are in
`tests/readme.md` (Timing Considerations). The two common cases:
promise/async content needs `await microtask()` after the promise
settles; a `use:*` plugin registered with the default
`onMicrotask=true` needs `await microtask()` after `render()`.

## Running

`npm run test:api -- <substring>` filters by path; `--bail` stops on
the first failure; `npm run watch:test` re-runs on change;
`npm run coverage` adds a c8 report under `generated/coverage/`. The
full pre-release gate is `npm test` (types + browser + babel-preset).
