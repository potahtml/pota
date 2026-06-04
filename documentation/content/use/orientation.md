---
title: orientation
subpath: pota/use/orientation
topic: Browser
desc:
  Current screen orientation ('horizontal' | 'vertical'), derived from
  documentSize.
---

# `pota/use/orientation`

`pota/use/orientation` exposes the current screen orientation as
`'horizontal'` or `'vertical'`, derived from
[`documentSize`](/use/resize) — so it tracks window resizes (including
device rotation) without a separate listener. It has the same
[`Emitter`](/use/emitter)-pair shape as
[`fullscreen`](/use/fullscreen) and [`visibility`](/use/visibility).

## Exports

- [`useOrientation()`](/use/orientation/useOrientation) — signal
  accessor returning `'horizontal' | 'vertical'`
- [`onOrientation(fn)`](/use/orientation/onOrientation) — callback
  fired whenever the orientation flips
