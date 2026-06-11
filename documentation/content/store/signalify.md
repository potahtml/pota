---
title: signalify
subpath: pota/store
topic: Store
desc:
  Turn an object's properties into tracked signal getters/setters in
  place, without recursing.
---

# signalify

Like [mutable](/store/mutable), but shallow and proxy-free: the
target's properties become tracked getters/setters in place —
including accessors inherited from the prototype chain, which is what
makes class getters work. Nested objects stay plain objects. Useful
for opt-in reactivity on a handful of keys without walking the whole
tree — for example signalifying class instance fields. Each key
becomes a [signal](/signal) behind the scenes.

Mutates `target` in place and returns the same reference, so the
original stays reactive. Functions are skipped (so methods stay
methods), as are `constructor`, `__proto__`, and well-known symbol
keys. With a `keys` argument, only the named properties are
signalified — and those keys don't have to exist yet. Keys you didn't
signalify stay plain even when assigned later: with no proxy involved,
new keys aren't auto-tracked (unlike [mutable](/store/mutable)).

## Arguments

| name     | type            | description                                                    |
| -------- | --------------- | -------------------------------------------------------------- |
| `target` | `T`             | object whose properties are turned into signals, in place      |
| `keys?`  | `PropertyKey[]` | only signalify these keys (may name keys that don't exist yet) |

**Returns:** the same `target` reference, now typed `Mutable<T>`.

## Examples

### All properties become reactive

Without a `keys` argument, every property of the target is
signalified — reading `state.count` in a reactive context re-runs when
it changes.

```jsx
import { render } from 'pota'
import { signalify } from 'pota/store'

const state = signalify({ count: 0 })

function App() {
	return (
		<div>
			<button on:click={() => state.count++}>increment</button>
			<pre>{() => state.count}</pre>
		</div>
	)
}

render(App)
```

### Selected keys

Pass a `keys` array to signalify only the properties you name. Here
only `lastName` is reactive — updating `firstName` does not re-run its
reader.

```jsx
import { render } from 'pota'
import { signalify } from 'pota/store'

const state = signalify({ firstName: 'Quack', lastName: 'Murci' }, [
	'lastName',
])

function App() {
	return (
		<div>
			<button on:click={() => (state.lastName = 'Duck')}>
				rename
			</button>
			<pre>{() => state.lastName}</pre>
		</div>
	)
}

render(App)
```

### Keys that don't exist yet

A named key need not exist when you signalify it — a read of the
missing key is tracked and its reader re-runs once the key is
assigned.

```jsx
import { render } from 'pota'
import { signalify } from 'pota/store'

const state = signalify({}, ['name'])

function App() {
	return (
		<div>
			<button on:click={() => (state.name = 'assigned')}>
				assign
			</button>
			<pre>{() => state.name ?? 'not set yet'}</pre>
		</div>
	)
}

render(App)
```
