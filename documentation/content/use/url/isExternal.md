---
title: isExternal
subpath: pota/use/url
topic: Routing
desc: True when a URL isn't under the current origin.
---

# isExternal

`isExternal(href)` returns `true` when the URL isn't under
`window.location.origin`. It compares `href + '/'` against
`origin + '/'`, so it guards against `example.net` matching
`example.net.ha.com`. Part of [`pota/use/url`](/use/url).

## Arguments

| Argument | Type     | Description       |
| -------- | -------- | ----------------- |
| `href`   | `string` | The URL to check. |

**Returns:** `boolean` — `true` when `href` is not under the current
origin.
