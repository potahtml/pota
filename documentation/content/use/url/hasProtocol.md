---
title: hasProtocol
subpath: pota/use/url
topic: Routing
desc:
  True when an href carries a scheme://, including a nested one like
  blob:http://.
---

# hasProtocol

`hasProtocol(href)` returns `true` when `href` carries a `scheme://`,
including a nested protocol like `blob:http://…`. It powers
[`isAbsolute`](/use/url/isAbsolute), which treats any link with a
protocol as absolute. Part of [`pota/use/url`](/use/url).

## Arguments

| Argument | Type     | Description      |
| -------- | -------- | ---------------- |
| `href`   | `string` | The URL to test. |

**Returns:** `true` if the URL has a (possibly nested) protocol,
`false` otherwise.

## Examples

### Detect a protocol

Absolute and nested-protocol URLs return `true`; rootless relative
ones return `false`.

```js
import { hasProtocol } from 'pota/use/url'

hasProtocol('http://local/') // true
hasProtocol('blob:http://local/') // true — nested protocol
hasProtocol('/about') // false
hasProtocol('about') // false
```
