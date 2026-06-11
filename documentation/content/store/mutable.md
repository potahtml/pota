---
title: mutable
subpath: pota/store
topic: Store
desc:
  Wrap a value in a deep proxy that turns every property into a
  signal, recursively and in place.
---

# mutable

Wraps `value` in a proxy that turns every property into a
[signal](/signal), recursively. Both existing and new properties are
tracked and mutable; reads of keys that don't exist yet are still
tracked, so once such a key is added its readers re-run. Arrays,
`Map`, and `Set` are proxied too, with their contents made mutable as
well.

`mutable(obj)` modifies `obj` in place, so the original reference
stays reactive, and identity lookups such as `.includes(original)` or
`.indexOf(original)` keep matching — reads hand back the proxy, but
the proxied methods normalize their argument to that same proxy. Pass
`true` as the second argument to _copy_ the input first, leaving the
original untouched. For the non-recursive, proxy-free version see
[signalify](/store/signalify); for a store with a single batched write
path see [store](/store/store).

## Arguments

| name     | type      | description                                            |
| -------- | --------- | ------------------------------------------------------ |
| `value`  | `T`       | value to make reactive; non-objects are returned as-is |
| `clone?` | `boolean` | when `true`, [copy](/store/copy) `value` first         |

**Returns:** a deeply reactive proxy — over `value` itself when
`clone` is omitted, over a [copy](/store/copy) when `clone` is `true`.

## Examples

### Deeply reactive

Nested properties are reactive too — bumping `state.deep.count`
re-runs the readers that read it.

```jsx
import { render } from 'pota'
import { mutable } from 'pota/store'

const state = mutable({ deep: { count: 0 } })

function App() {
	return (
		<div>
			<button on:click={() => state.deep.count++}>increment</button>
			<pre>{() => state.deep.count}</pre>
		</div>
	)
}

render(App)
```

### Copy first

By default `mutable` wraps the original in place, so identity
references survive. Pass `true` to copy first — the original stays
untouched, but identity references are not preserved.

```jsx
import { render } from 'pota'
import { mutable } from 'pota/store'

// default: keep the reference to m1

const m1 = {}
const s1 = mutable([m1])

render(<pre>in place keeps reference: {String(s1.includes(m1))}</pre>)

// clone: lose the reference to m2

const m2 = {}
const s2 = mutable([m2], true)

render(<pre>copy loses reference: {String(s2.includes(m2))}</pre>)
```
