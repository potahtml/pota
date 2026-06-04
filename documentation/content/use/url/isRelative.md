---
title: isRelative
subpath: pota/use/url
topic: Routing
desc:
  True for hrefs that are neither rooted at / nor carry a protocol.
---

# isRelative

`isRelative(href)` is `!`[`isAbsolute(href)`](/use/url/isAbsolute) —
`true` for hrefs that are neither rooted at `/` nor carry a protocol.
Part of [`pota/use/url`](/use/url).

## Arguments

| Argument | Type     | Description       |
| -------- | -------- | ----------------- |
| `href`   | `string` | The URL to check. |

**Returns:** `boolean` — `true` when `href` is relative.
