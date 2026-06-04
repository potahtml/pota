---
title: encodeURIComponent
subpath: pota/use/url
topic: Routing
desc:
  Platform encodeURIComponent, re-exported alongside the safe decoder.
---

# encodeURIComponent

`encodeURIComponent` is a passthrough of the platform function,
re-exported so the encode / decode pair lives in one import. Its
companion [`decodeURIComponent`](/use/url/decodeURIComponent) is a
safe variant that returns the input instead of throwing. Part of
[`pota/use/url`](/use/url).

## Arguments

| Argument | Type     | Description           |
| -------- | -------- | --------------------- |
| `string` | `string` | The string to encode. |

**Returns:** the percent-encoded string (identical to the platform
`encodeURIComponent`).

## Examples

### Encode a value

Percent-encodes a string exactly like the platform function.

```js
import { encodeURIComponent } from 'pota/use/url'

encodeURIComponent('a b') // 'a%20b'
```
