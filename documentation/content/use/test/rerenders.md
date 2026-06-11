---
title: rerenders
subpath: pota/use/test
topic: Internals
desc:
  Flash every element on each render — a render-thrashing visualiser.
---

# rerenders

`rerenders()` injects an adopted stylesheet that flashes every element
with a blue background whenever it rerenders — a drop-in visualiser
for render thrashing. The flash is a one-second CSS animation that
runs each time an element is (re)created and enters the DOM; the
stylesheet is adopted on `document`, so call it once and watch the
page. Part of [`pota/use/test`](/use/test).

## Arguments

Takes no arguments.

**Returns:** nothing — the stylesheet stays adopted on `document`.
