---
title: cleanLink
subpath: pota/use/url
topic: Routing
desc:
  Strip a trailing . , or " that links pick up when copied from prose.
---

# cleanLink

`cleanLink(v)` strips a single trailing `.`, `,`, or `"` — the
punctuation a link often picks up when copied from a sentence —
returning the cleaned string. Part of [`pota/use/url`](/use/url).

## Arguments

| Argument | Type     | Description           |
| -------- | -------- | --------------------- |
| `v`      | `string` | The link to clean up. |

**Returns:** the string with one trailing `.`, `,`, or `"` removed (if
present).

## Examples

### Strip trailing punctuation

Removes a single trailing `.`, `,`, or `"` a link picks up when copied
out of a sentence.

```js
import { cleanLink } from 'pota/use/url'

cleanLink('https://pota.quack.uy/.') // 'https://pota.quack.uy/'
cleanLink('https://pota.quack.uy/,') // 'https://pota.quack.uy/'
cleanLink('https://pota.quack.uy/') // 'https://pota.quack.uy/'
```
