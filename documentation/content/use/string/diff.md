---
title: diff
subpath: pota/use/string
topic: Utilities
desc: Mark the first line divergence between two multi-line strings.
---

# diff

`diff(a, b)` compares two multi-line strings and returns
`[markedA, markedB]` where each line is prefixed with `'  '` (equal)
or `'->'` at the first divergence. Non-string or single-line inputs
are returned unchanged. Used by [`pota/use/test`](/use/test) to
display assertion failures. Part of [`pota/use/string`](/use/string).

## Arguments

| Argument | Type      | Description                  |
| -------- | --------- | ---------------------------- |
| `a`      | `unknown` | The first value to compare.  |
| `b`      | `unknown` | The second value to compare. |

**Returns:** `[markedA, markedB]`. The marking only happens when both
`a` and `b` are strings that each contain a newline; only the first
diverging line is flagged with `'->'`, every other line gets the
`'  '` prefix. Each compared line is run through
[`toString`](/use/string/toString) before marking. Any other input
(non-string, or single-line) is returned as `[a, b]` untouched.
