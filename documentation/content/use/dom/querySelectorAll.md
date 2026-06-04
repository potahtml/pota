---
title: querySelectorAll
subpath: pota/use/dom
topic: Internals
desc: Finds all descendants of a node matching a CSS selector.
---

# querySelectorAll

`querySelectorAll(node, query)` returns the `NodeList` of every
descendant of `node` matching the CSS `query` — the per-node form of
`node.querySelectorAll`. Its single-match companion is
[`querySelector`](/use/dom/querySelector). For document-scoped
shorthands with type inference, see [`pota/use/test`](/use/test)'s
[`$`](/use/test/$) / [`$$`](/use/test/$$). Part of
[`pota/use/dom`](/use/dom).
