---
title: dashesToCamelCase
subpath: pota/use/string
topic: Utilities
desc: kebab-case → camelCase.
---

# dashesToCamelCase

`dashesToCamelCase(s)` converts kebab-case to camelCase — `'foo-bar'`
→ `'fooBar'`. Part of [`pota/use/string`](/use/string).

## Arguments

| Argument | Type     | Description                       |
| -------- | -------- | --------------------------------- |
| `s`      | `string` | The kebab-case string to convert. |

**Returns:** the camelCased string. A dash followed by a lowercase
letter or digit (`-([a-z0-9])`) is replaced by the uppercased
character; other dashes are left in place.
