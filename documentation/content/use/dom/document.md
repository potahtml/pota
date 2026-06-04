---
title: document
subpath: pota/use/dom
topic: Internals
desc: window.document, re-exported as a typed Document.
---

# document

`document` re-exports `window.document`, typed as `Document`. It is a
plain value, not a function — importing it avoids repeating the global
lookup and keeps the rest of [`pota/use/dom`](/use/dom) consistent.
[head](/use/dom/head) and [documentElement](/use/dom/documentElement)
are convenience accessors off the same object.
