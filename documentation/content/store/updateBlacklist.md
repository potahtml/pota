---
title: updateBlacklist
subpath: pota/store
topic: Store
desc:
  Register another realm's constructors so mutable leaves its
  built-ins (Date, RegExp, DOM nodes) opaque.
---

# updateBlacklist

[mutable](/store/mutable) refuses to wrap built-ins like `Date`,
`RegExp`, or DOM nodes — they live on a constructor blacklist sourced
from the host `globalThis`. Instances from a different realm (an
iframe, a worker's `globalThis`) have different constructors, so they
would not match the host blacklist and could get proxied.

Call `updateBlacklist(otherWindow)` once to add that realm's
constructors and well-known symbols to the blacklists. The base
trackable constructors (`Object`, `Array`, `Map`, `Set`) from the
other realm stay trackable; everything else from it becomes opaque,
just like the host's own built-ins.

## Arguments

| name     | type                         | description                                    |
| -------- | ---------------------------- | ---------------------------------------------- |
| `window` | `Window & typeof globalThis` | the other realm whose constructors to register |

**Returns:** nothing.

## Examples

### Teaching mutable about another realm

Register an iframe's `globalThis` so a `Date` created inside it is
treated as opaque by `mutable`, exactly like the host's own `Date`.

```jsx
import { updateBlacklist } from 'pota/store'

const frame = document.createElement('iframe')
document.body.append(frame)

updateBlacklist(frame.contentWindow)

// now `mutable(...)` leaves instances of frame.contentWindow.Date
// opaque, just like instances of the host's Date
```
