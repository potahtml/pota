---
title: intersection
subpath: pota/use/intersection
topic: Observers
desc: IntersectionObserver behind a use*/on* pair, plus ref factories.
---

# `pota/use/intersection`

`pota/use/intersection` wraps `IntersectionObserver` behind the same
`use*` / `on*` pair you find on other document-level emitters
([`fullscreen`](/use/fullscreen), [`orientation`](/use/orientation),
etc.), plus two ref factories you attach with `use:ref`.

Multiple subscribers on the same node share one observer. Cleanup
happens automatically when the owning scope disposes — the observer
disconnects once the last subscriber unmounts.

## Exports

- [`useVisible(node, opts?)`](/use/intersection/useVisible) — signal
  accessor
- [`onVisible(node, fn, opts?)`](/use/intersection/onVisible) —
  side-effect callback
- [`visible(handler, opts?)`](/use/intersection/visible) — `use:ref`
  factory
- [`lazyImage(opts?)`](/use/intersection/lazyImage) — `use:ref`
  factory for lazy `<img>` loading
