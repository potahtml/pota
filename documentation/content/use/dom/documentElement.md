---
title: documentElement
subpath: pota/use/dom
topic: Internals
desc: The root <html> element, read from document.documentElement.
---

# documentElement

`documentElement` re-exports `document?.documentElement` — the root
`<html>` element. It is a plain value, not a function, and is
`undefined` when there is no `document` (non-browser environment).
Part of [`pota/use/dom`](/use/dom).
