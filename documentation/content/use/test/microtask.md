---
title: microtask
subpath: pota/use/test
topic: Internals
desc: Promise.resolve() — yield to the microtask queue.
---

# microtask

`microtask()` is `Promise.resolve()` — await it to yield to the
microtask queue. For a macrotask see
[`macrotask`](/use/test/macrotask). Part of
[`pota/use/test`](/use/test).

## Arguments

Takes no arguments.

**Returns:** `Promise<void>` that resolves on the next microtask.
