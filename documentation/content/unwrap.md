---
title: unwrap
subpath: pota
topic: Reactive core
desc:
  Recursively calls any function it encounters and flattens arrays one
  level, returning a plain snapshot value.
---

# unwrap

Recursively calls any function it encounters and flattens arrays one
level, returning a plain value. It is the snapshot half of
[resolve](/resolve): `resolve` wraps `unwrap` in a memo so the result
is reactive; `unwrap` on its own does the same walk once and returns a
plain value with no subscriptions.

Reach for it only when you genuinely need a one-shot snapshot outside
a tracking scope. For any reactive use prefer [resolve](/resolve),
which memoises the walk so subsequent reads are cheap and consumers
re-run on change.

## Arguments

| name       | type | description                                               |
| ---------- | ---- | --------------------------------------------------------- |
| `children` | `T`  | value to resolve — a function, an array, or anything else |

If `children` is a function it is called and the result is unwrapped
recursively. If it is an array each entry is unwrapped and the results
are concatenated (one-level flatten). Anything else is returned as-is.

**Returns:** `Resolved<T>` — the fully walked, plain value.

## Examples

### Snapshot a JSX tree

Resolve children once without creating subscriptions — useful when you
need an array of nodes during a non-reactive operation.

```jsx
import { unwrap } from 'pota'

const items = ['a', 'b', 'c']

const nodes = unwrap(() => items.map(item => <li>{item}</li>))
// nodes: an array of <li> elements, no subscriptions created
```
