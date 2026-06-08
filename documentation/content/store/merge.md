---
title: merge
subpath: pota/store
topic: Store
desc:
  Reconcile source into target in place, keeping references intact and
  matching nested arrays by index or key.
---

# merge

Merges `source` into `target` in place and returns `target`. Keys of
`target` that are absent from `source` are left alone, and references
to unchanged properties are kept intact.

`merge`, [replace](/store/replace), and [reset](/store/reset) are
narrow reconcilers so each use case stays explicit. `merge` and
`replace` accept an optional `keys` option telling the reconciler how
to identify items inside nested arrays. Without it, entries are
matched by index; with it, they are matched by the named key,
unmatched source items are appended, and references to matched items
survive across reorderings.

## Arguments

| name     | type               | description                                                                |
| -------- | ------------------ | -------------------------------------------------------------------------- |
| `target` | `T`                | object mutated in place and returned                                       |
| `source` | `U`                | values to merge in (deep-copied before merging, so it is left untouched)   |
| `keys?`  | `ReconcileKeys<U>` | per-path key names for matching nested array items; shape mirrors `source` |

**Returns:** `target` (the same reference), now typed `T & U`.

## Examples

### Positional merge

With no `keys` option, nested arrays are merged positionally — index
`0` against index `0`, and so on.

```jsx
import { render } from 'pota'
import { merge } from 'pota/store'

const target = { aa: true, q: [1, 2] }

const source = { bb: true, q: [3] }

merge(target, source)

render(<pre>{JSON.stringify(target, null, 2)}</pre>)
```

### Keyed merge

Passing `{ q: { key: 'id' } }` tells `merge` to match entries inside
`q` by `id`; unmatched items from `source` are appended, and the
reference to a matched item is preserved in place.

```jsx
import { render } from 'pota'
import { merge } from 'pota/store'

const target = {
	a: true,
	q: [{ id: 0 }, { id: 1, name: 'Quack' }],
}

const source = {
	b: true,
	q: [{ id: 1, lastName: 'Murci' }, { id: 2 }],
}

const ref = target.q[1]

merge(target, source, { q: { key: 'id' } })

render(<pre>reference preserved: {ref === target.q[1]}</pre>)

render(<pre>{JSON.stringify(target, null, 2)}</pre>)
```
