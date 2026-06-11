---
title: replace
subpath: pota/store
topic: Store
desc:
  Reconcile source into target in place and remove target keys absent
  from source, keeping references intact.
---

# replace

Like [merge](/store/merge), but also removes keys from `target` that
are absent from `source`. Mutates `target` in place and returns it;
references to unchanged properties are kept intact, and `source` is
deep-copied before reconciling so it is left untouched.

Accepts the same optional `keys` option as `merge` — without it,
nested array entries are matched by index; with it, they are matched
by the named key, surviving items keep their references, and entries
present in `target` but missing from `source` are dropped. For the
non-removing variant see [merge](/store/merge); for an additive reset
see [reset](/store/reset).

## Arguments

| name     | type               | description                                                                   |
| -------- | ------------------ | ----------------------------------------------------------------------------- |
| `target` | `T`                | object mutated in place and returned                                          |
| `source` | `U`                | desired final shape (deep-copied before reconciling, so it is left untouched) |
| `keys?`  | `ReconcileKeys<U>` | per-path key names for matching nested array items; shape mirrors `source`    |

**Returns:** `target` (the same reference), now typed `T & U`. The
type approximates the final shape — keys of `T` deleted at runtime
still appear in it.

## Examples

### Positional replace

Same starting data as the [merge](/store/merge) example — but here
everything absent from `source` (the `aa` key) is removed, and the
array is replaced by index.

```jsx
import { render } from 'pota'
import { replace } from 'pota/store'

const target = { aa: true, q: [1, 2] }

const source = { bb: true, q: [3] }

replace(target, source)

render(<pre>{JSON.stringify(target, null, 2)}</pre>)
```

### Keyed replace

With `{ q: { key: 'id' } }`, rows are matched by `id`; the row missing
from `source` is dropped, the surviving row keeps its reference, and a
new row is appended.

```jsx
import { render } from 'pota'
import { replace } from 'pota/store'

const target = {
	a: true,
	q: [{ id: 0 }, { id: 1, name: 'Quack' }],
}

const source = {
	b: true,
	q: [{ id: 1, lastName: 'Murci' }, { id: 2 }],
}

const ref = target.q[1]

replace(target, source, { q: { key: 'id' } })

render(<pre>reference preserved: {String(ref === target.q[0])}</pre>)

render(<pre>{JSON.stringify(target, null, 2)}</pre>)
```
