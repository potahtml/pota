---
title: activeElement
subpath: pota/use/dom
topic: Internals
desc: document.activeElement, read on call.
---

# activeElement

`activeElement()` returns `document.activeElement` — the currently
focused element, or `null`. It's a function so the value is read on
call rather than captured once. Part of [`pota/use/dom`](/use/dom).

## Arguments

Takes no arguments.

**Returns:** `Element | null` — the currently focused element.
