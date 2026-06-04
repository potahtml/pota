---
title: isProxy
subpath: pota/use/test
topic: Internals
desc: True when a value is a Proxy created after this module loaded.
---

# isProxy

`isProxy(value)` returns `true` when `value` is a `Proxy`. It's
implemented by wrapping the global `Proxy` constructor — so only
proxies created after this module loads are tracked, which is why it's
meant for debugging and tests rather than production checks. Part of
[`pota/use/test`](/use/test).

## Arguments

| Name    | Type      | Description          |
| ------- | --------- | -------------------- |
| `value` | `unknown` | The value to inspect |

**Returns:** `boolean` — `true` if `value` is a tracked `Proxy`.
