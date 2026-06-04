---
title: removeNestedProtocol
subpath: pota/use/url
topic: Routing
desc: Unwrap a nested protocol — blob:http://… → http://….
---

# removeNestedProtocol

`removeNestedProtocol(href)` unwraps a nested protocol —
`blob:http://…` becomes `http://…`. Part of
[`pota/use/url`](/use/url).

## Arguments

| Argument | Type     | Description       |
| -------- | -------- | ----------------- |
| `href`   | `string` | The URL to strip. |

**Returns:** `string` — `href` with the outer nested protocol removed.
