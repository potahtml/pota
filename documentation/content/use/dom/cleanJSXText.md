---
title: cleanJSXText
subpath: pota/use/dom
topic: Internals
desc: Mirror the whitespace rules JSX applies to JSXText children.
---

# cleanJSXText

`cleanJSXText(value)` mirrors the whitespace rules JSX applies to
`JSXText` children: strip leading/trailing whitespace adjacent to
tags, drop blank lines, and add a single trailing space to non-last
lines that survived. Returns `''` when the input was pure whitespace.

It's exposed so the [`xml`](/xml/xml) tagged-template parser can
normalise text the same way the compiler does — keeping xml↔jsx
round-trips from having to fix up whitespace. It mirrors
`cleanJSXElementLiteralChild` in the Babel preset. Part of
[`pota/use/dom`](/use/dom).

## Arguments

| Argument | Type     | Description                |
| -------- | -------- | -------------------------- |
| `value`  | `string` | The raw text to normalise. |

**Returns:** `string` — the cleaned text, or `''` if it was all
whitespace.
