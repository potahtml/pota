---
title: copy
subpath: pota/store
topic: Store
desc:
  Deep clone that preserves prototypes, symbol/non-enumerable keys,
  descriptors, cycles, and frozen state.
---

# copy

A structural deep clone with extras. `copy(value)` preserves the
prototype chain (so class instances stay `instanceof`), copies
non-enumerable and symbol keys with their full descriptor attributes,
handles cycles, and re-applies frozen / sealed / non-extensible state.
Accessor descriptors are snapshotted: the getter is invoked once
inside [untrack](/untrack) and the result stored as plain data, so the
copy is a value snapshot, not a live recomputing view. Built-ins
listed in the mutation blacklist (`Date`, `RegExp`, DOM elements, …)
pass through by reference.

`copy` is what [mutable](/store/mutable) and the reconcilers
([merge](/store/merge), [replace](/store/replace)) use when asked to
clone before mutating.

## Arguments

| name    | type | description                                  |
| ------- | ---- | -------------------------------------------- |
| `value` | `T`  | value to deep-copy; non-objects pass through |

**Returns:** a deep copy of `value` (same type `T`). Non-object inputs
and blacklisted built-ins are returned unchanged.

## Examples

### Cloning a class instance

The clone keeps the prototype (so it stays `instanceof`), snapshots
the getter as a value, and preserves a self-referential cycle.

```jsx
import { copy } from 'pota/store'
import { render } from 'pota'

class Point {
	x
	y
	constructor(x, y) {
		this.x = x
		this.y = y
	}
	get magnitude() {
		return Math.hypot(this.x, this.y)
	}
}

const a = new Point(3, 4)
const b = copy(a)

const cyclic = { name: 'self', me: null }
cyclic.me = cyclic
const c = copy(cyclic)

render(
	<pre>
		{JSON.stringify(
			{
				instanceOf: b instanceof Point,
				values: [b.x, b.y, b.magnitude],
				sameRef: a === b,
				cyclePreserved: c.me === c,
			},
			null,
			2,
		)}
	</pre>,
)
```
