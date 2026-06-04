---
title: randomId
subpath: pota/use/random
topic: Utilities
desc: A short base36 id from a crypto-generated 64-bit integer.
---

# randomId

Returns a base36 string of one crypto-generated 64-bit integer —
roughly 12–13 characters, collision-safe for typical UI key purposes.
Part of [`pota/use/random`](/use/random).

## Arguments

`randomId()` takes no arguments.

**Returns:** `string` — a base36 id read from
`crypto.getRandomValues`.

## Examples

### A unique id

Reads 64 bits from `crypto` and renders them in base36 for a short,
URL-safe identifier.

```js
import { randomId } from 'pota/use/random'

const id = randomId() // e.g. 'k3f9a1zq8b2'
```
