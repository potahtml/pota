---
title: scroll
subpath: pota/use/scroll
topic: Browser
desc: A scrollIntoView ref factory plus imperative scrolling helpers.
---

# `pota/use/scroll`

`pota/use/scroll` exports
[`scrollIntoView`](/use/scroll/scrollIntoView) as a ref factory plus a
handful of imperative scrolling helpers — element targeting,
hash-driven scroll, and scroll-to-top. Reach for the imperative
helpers when you don't have a ref-factory opportunity (handling a
click, responding to a route change, etc.).

## Exports

- [`scrollIntoView(opts?)`](/use/scroll/scrollIntoView) — `use:ref`
  factory: scroll the element into view on mount
- [`scrollToElement(node)`](/use/scroll/scrollToElement) — reset
  `scrollTop` and `scrollIntoView(true)`
- [`scrollToSelector(selector)`](/use/scroll/scrollToSelector) —
  resolve a hash (id-first) or CSS selector; returns `true` on success
- [`scrollToSelectorWithFallback(selector)`](/use/scroll/scrollToSelectorWithFallback)
  — same, falls back to `scrollToTop()` on a miss
- [`scrollToLocationHash()`](/use/scroll/scrollToLocationHash) —
  scroll to `window.location.hash` if a match exists
- [`scrollToTop()`](/use/scroll/scrollToTop) —
  `window.scrollTo({ top: 0 })`
