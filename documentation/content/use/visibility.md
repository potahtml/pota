---
title: visibility
subpath: pota/use/visibility
topic: Browser
desc:
  Track document visibility (Page Visibility API) reactively or
  synchronously.
---

# `pota/use/visibility`

`pota/use/visibility` tracks the
[Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)
— whether the current document is visible to the user (the tab is
active and the window isn't minimized or covered). It exposes a
synchronous reader plus an [`Emitter`](/use/emitter) pair, mirroring
the shape of [`fullscreen`](/use/fullscreen).

## Exports

- [`isDocumentVisible()`](/use/visibility/isDocumentVisible) —
  synchronous boolean read (non-reactive)
- [`useDocumentVisible()`](/use/visibility/useDocumentVisible) —
  reactive signal accessor
- [`onDocumentVisible(fn)`](/use/visibility/onDocumentVisible) —
  side-effect callback
