---
title: sleepLong
subpath: pota/use/test
topic: Internals
desc: sleep(300) — the fixed wait for router / location tests.
---

# sleepLong

`sleepLong()` is [`sleep(300)`](/use/test/sleep) — the single tunable
wait used by router / location tests where a macrotask isn't enough
(e.g. `history.back()`, delayed navigation, `Navigate` with `replace`,
`useBeforeLeave`). Tuning this one constant retimes every flaky wait.
Part of [`pota/use/test`](/use/test).

## Arguments

Takes no arguments.

**Returns:** `Promise<void>` that resolves after 300 milliseconds.
