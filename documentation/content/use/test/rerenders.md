---
title: rerenders
subpath: pota/use/test
topic: Internals
desc:
  Flash every element on each render — a render-thrashing visualiser.
---

# rerenders

`rerenders()` injects a temporary adopted stylesheet that flashes
every element with a blue background whenever it rerenders — a drop-in
visualiser for render thrashing. The flash is a one-second CSS
animation triggered on `document`, so call it once and watch the page.
Part of [`pota/use/test`](/use/test).

## Arguments

Takes no arguments.

**Returns:** the adopted stylesheet result of `addAdoptedStyleSheet`.
