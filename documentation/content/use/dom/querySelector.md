---
title: querySelector
subpath: pota/use/dom
topic: Internals
desc: Finds the first descendant of a node matching a CSS selector.
---

# querySelector

`querySelector(node, query)` returns the first descendant of `node`
matching the CSS `query`, or `null` — the per-node form of
`node.querySelector`. Its companion is
[`querySelectorAll`](/use/dom/querySelectorAll). For document-scoped
shorthands with type inference, see [`pota/use/test`](/use/test)'s
[`$`](/use/test/$) / [`$$`](/use/test/$$). Part of
[`pota/use/dom`](/use/dom).
