---
title: sleep
subpath: pota/use/test
topic: Internals
desc: setTimeout(_, ms) wrapped in a promise.
---

# sleep

`sleep(ms = 0)` is `setTimeout(_, ms)` wrapped in a promise —
`await sleep(50)` to pause. The fixed longer wait is
[`sleepLong`](/use/test/sleepLong). Part of
[`pota/use/test`](/use/test).

## Arguments

| Name | Type     | Description                              |
| ---- | -------- | ---------------------------------------- |
| `ms` | `number` | Delay in milliseconds (defaults to `0`). |

**Returns:** `Promise<void>` that resolves after `ms` milliseconds.
