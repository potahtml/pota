---
title: tokenList
subpath: pota/use/dom
topic: Internals
desc:
  Trim and split a string by whitespace; falsy → shared empty array.
---

# tokenList

`tokenList(s)` trims and splits a string by whitespace; for falsy or
whitespace-only input it returns the module-shared empty array. Used
by [`addClass`](/use/dom/addClass) /
[`removeClass`](/use/dom/removeClass). Part of
[`pota/use/dom`](/use/dom).

## Arguments

| Argument | Type                          | Description          |
| -------- | ----------------------------- | -------------------- |
| `s`      | `string \| undefined \| null` | The string to split. |

**Returns:** `string[]` — the whitespace-separated tokens, or the
shared empty array for falsy / whitespace-only input.
