---
title: reset
subpath: pota/store
topic: Store
desc:
  Reconcile source into target in place, replacing nested arrays
  wholesale while keeping target-only keys.
---

# reset

Reconciles into `target` whatever is defined in `source`, leaving any
`target` keys that `source` doesn't mention untouched. Unlike
[replace](/store/replace), which removes keys absent from `source`,
`reset` is additive. And unlike [merge](/store/merge), nested arrays
are overwritten wholesale rather than reconciled item-by-item — there
is no `keys` option. Mutates `target` in place and returns it;
`source` is deep-copied before reconciling, so the original `source`
is left untouched.

For the removing variant see [replace](/store/replace); for a
non-removing merge of nested arrays by key see [merge](/store/merge).

## Arguments

| name     | type | description                                                         |
| -------- | ---- | ------------------------------------------------------------------- |
| `target` | `T`  | object mutated in place and returned                                |
| `source` | `U`  | values to reconcile in (deep-copied first, so it is left untouched) |

**Returns:** `target` (the same reference), now typed `T & U`.

## Examples

### Overwrite matching keys

Keys present in both objects are overwritten with the `source` value;
keys only in `target` (here `aa`) survive.

```jsx
import { render } from 'pota'
import { reset } from 'pota/store'

const target = {
	aa: true,
	q: [1, 2],
	w: { nope: 'ok', hola: [1, 2, 3] },
}

const source = { q: [], w: { hola: [], bb: false } }

reset(target, source)

render(<pre>{JSON.stringify(target, null, 2)}</pre>)
```

### Reset to defaults

Build a [mutable](/store/mutable) from a `defaultState`, then reset
part of it back to those defaults. Note the
`mutable(defaultState, true)` copy — otherwise the mutable proxy would
share references with `defaultState`.

```jsx
import { render } from 'pota'
import { mutable, reset } from 'pota/store'

const defaultState = {
	title: 'untitled',
	keyframes: [],
	timeline: {},
	sidebarExpanded: true,
}

const state = mutable(defaultState, true)

const toggleSidebar = () =>
	(state.sidebarExpanded = !state.sidebarExpanded)

function addData() {
	state.keyframes = [1, 2, 3]
	state.timeline = { currentTime: 1000 }
	state.title = 'edited'
}

function resetState() {
	// keep title and sidebarExpanded, reset everything else
	const { title, sidebarExpanded, ...rest } = defaultState
	reset(state, rest)
}

function App() {
	return (
		<div>
			<button on:click={toggleSidebar}>toggle sidebar</button>
			<button on:click={addData}>add data</button>
			<button on:click={resetState}>reset</button>
			<pre>{() => JSON.stringify(state, null, 2)}</pre>
		</div>
	)
}

render(App)
```
