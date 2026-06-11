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

The check is a plain string prefix on the href as given: a relative
string (`/about`) doesn't carry the origin, so it tests external. Feed
it fully-qualified URLs — for example an anchor's `href` property,
which the browser resolves.

## Arguments

| Argument | Type     | Description       |
| -------- | -------- | ----------------- |
| `href`   | `string` | The URL to check. |

**Returns:** `boolean` — `true` when `href` is not under the current
origin.

## Examples

### Classify links against the current origin

Fully-qualified URLs compare against the origin; relative strings test
external — resolve them first.

```js
import { isExternal } from 'pota/use/url'

// with origin https://pota.quack.uy
isExternal('https://pota.quack.uy/use/url') // false
isExternal('https://example.net/') // true
isExternal('/use/url') // true — no origin prefix; resolve first
```
