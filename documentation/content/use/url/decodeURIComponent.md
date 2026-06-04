---
title: decodeURIComponent
subpath: pota/use/url
topic: Routing
desc:
  Safe decodeURIComponent — returns the input instead of throwing on
  malformed input.
---

# decodeURIComponent

`decodeURIComponent(string)` is a safe variant of the platform
function: it returns the original string instead of throwing on
malformed sequences — important when decoding URLs that users copy,
paste, and edit by hand. Its companion
[`encodeURIComponent`](/use/url/encodeURIComponent) is a plain
passthrough of the platform function. Part of
[`pota/use/url`](/use/url).

## Arguments

| Argument | Type     | Description           |
| -------- | -------- | --------------------- |
| `string` | `string` | The string to decode. |

**Returns:** the decoded string, or the original string when decoding
fails.

## Examples

### Decode safely

Decodes a percent-encoded string, returning the input untouched when
it is malformed rather than throwing.

```js
import { decodeURIComponent } from 'pota/use/url'

decodeURIComponent('a%20b') // 'a b'
decodeURIComponent('%') // '%' — platform version would throw
```
