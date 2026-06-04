---
title: macrotask
subpath: pota/use/test
topic: Internals
desc: setTimeout(_, 0) as a promise — yield a macrotask.
---

# macrotask

`macrotask()` is `setTimeout(_, 0)` as a promise — await it to yield a
macrotask. For a microtask see [`microtask`](/use/test/microtask); for
a longer fixed wait see [`sleepLong`](/use/test/sleepLong). Part of
[`pota/use/test`](/use/test).

## Arguments

Takes no arguments.

**Returns:** `Promise<void>` that resolves after one macrotask.
