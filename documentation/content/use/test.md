---
title: test
subpath: pota/use/test
topic: Internals
desc: The tiny in-browser test runner the pota test suite is built on.
---

# `pota/use/test`

The tiny in-browser test runner the pota test suite is built on. A
`test` function with an `expect`-like API, plus DOM-introspection,
timing, and selector shorthands. There's no CLI — tests log to the
console and assertions reject promises on failure.

## Exports

- `test(title, fn, stopTesting?)` — run a test (documented below)
- [`isProxy(value)`](/use/test/isProxy) — is the value a `Proxy`?
- [`rerenders()`](/use/test/rerenders) — flash elements on each render
- [`body()`](/use/test/body) — `document.body.innerHTML.trim()`
- [`head()`](/use/test/head) — `document.head.innerHTML.trim()`
- [`childNodes(node?)`](/use/test/childNodes) — child count, defaults
  to `document.body`
- [`$(selector, node?)`](/use/test/$) — `querySelector`, type-inferred
- [`$$(selector, node?)`](/use/test/$$) — `querySelectorAll` as an
  `Array`
- [`microtask()`](/use/test/microtask) — `Promise.resolve()`
- [`macrotask()`](/use/test/macrotask) — `setTimeout(_, 0)`
- [`sleep(ms?)`](/use/test/sleep) — `setTimeout(_, ms)` as a promise
- [`sleepLong()`](/use/test/sleepLong) — `sleep(300)` for router /
  location tests

## test

`test(title, fn, stopTesting?)` runs `fn(expect)` and collects every
assertion's promise. It returns a `Promise.all` of them, so
`await`-ing the test waits for async assertions. Pass
`stopTesting: true` to stop the module's subsequent `test()` calls
from running — useful when one failure makes later assertions
meaningless. `test.reset()` resets the test numbering back to `1`
(test-runner hook).

## expect

The `expect(value)` object exposes `toBe` (strict `===`), `toEqual`
(deep, sorted JSON compare), `toInclude`, `toThrow`, `toMatch(regex)`,
plus a `.not` namespace mirroring all of them. `toEqual`, `toInclude`,
and `toThrow` run inside an [untrack](/untrack) so reading signals
during compare doesn't create subscriptions.

## Examples

### Round-tripping a signal

A minimal test that asserts a signal reads back what was written. Each
`expect(value)` builds an assertion against `value`.

```jsx
import { signal } from 'pota'
import { test } from 'pota/use/test'

test('signal round-trip', expect => {
	const s = signal(1)
	expect(s.read()).toBe(1)
	s.write(2)
	expect(s.read()).toBe(2)
})
```

### Asserting rendered DOM

Render a component and assert against a trimmed snapshot of the body
with [body](/use/test/body), and the matcher family.

```jsx
import { render } from 'pota'
import { test, body, childNodes } from 'pota/use/test'

function App() {
	return <p class="greeting">hello</p>
}

render(App)

test('renders the greeting', expect => {
	expect(body()).toBe('<p class="greeting">hello</p>')
	expect(body()).toInclude('hello')
	expect(childNodes()).toBe(1)
})
```

### The `.not` namespace and async assertions

Mirror every matcher under `.not`. Returning a promise from the test
body makes `test()` wait for it before resolving.

```jsx
import { test, microtask, body } from 'pota/use/test'

test('clears after a microtask', async expect => {
	document.body.innerHTML = '<span>busy</span>'
	expect(body()).not.toBe('')

	await microtask()
	document.body.innerHTML = ''
	expect(body()).toBe('')
})
```
