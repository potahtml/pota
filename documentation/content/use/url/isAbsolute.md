---
title: isAbsolute
subpath: pota/use/url
topic: Routing
desc: True when an href starts with / or carries a protocol.
---

# isAbsolute

`isAbsolute(href)` returns `true` when `href` starts with `/` or
carries a protocol (via [`hasProtocol`](/use/url/hasProtocol)). The
inverse is [`isRelative`](/use/url/isRelative). Part of
[`pota/use/url`](/use/url).

## Arguments

| Argument | Type     | Description      |
| -------- | -------- | ---------------- |
| `href`   | `string` | The URL to test. |

**Returns:** `true` if the URL is absolute, `false` otherwise.

## Examples

### Classify a few links

`/`-rooted and protocol-bearing URLs are absolute; bare and hash links
are not.

```js
import { isAbsolute } from 'pota/use/url'

isAbsolute('/about') // true
isAbsolute('http://local/') // true
isAbsolute('about') // false
isAbsolute('#section') // false
```
