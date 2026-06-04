---
title: importNode
subpath: pota/use/dom
topic: Internals
desc: document.importNode — used when adopting a template's content.
---

# importNode

`importNode(externalNode, deep?)` is `document.importNode`, pre-bound
to `document`. It imports a node from another document, and pota uses
it when adopting a template's content into the live document. Part of
[`pota/use/dom`](/use/dom).
