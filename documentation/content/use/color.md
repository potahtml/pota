---
title: color
subpath: pota/use/color
topic: Utilities
desc:
  A small palette of color helpers — EyeDropper, OkLab gradients, APCA
  readability, validation.
---

# `pota/use/color`

`pota/use/color` bundles a small palette of color helpers: a wrapper
over the browser `EyeDropper` API, a perceptually-uniform gradient
generator, APCA-based readability helpers, validation, and a
passthrough of the popular `color-bits` string helpers (`alpha`,
`blend`, `darken`, `lighten`, `getLuminance`).

## Exports

- [`eyeDropper(cb)`](/use/color/eyeDropper) — pick an sRGB color with
  the browser EyeDropper
- [`scale(colors, count?)`](/use/color/scale) — OkLab-interpolated
  gradient ramp
- [`textColor(color)`](/use/color/textColor) — `'white'` or `'black'`,
  whichever reads better
- [`textColorWhenBackgroundIsBlack(color)`](/use/color/textColorWhenBackgroundIsBlack)
  — lighten until readable on black
- [`textColorWhenBackgroundIsWhite(color)`](/use/color/textColorWhenBackgroundIsWhite)
  — darken until readable on white
- [`validateColor(string)`](/use/color/validateColor) — passthrough if
  it parses, else `undefined`

## Re-exports from color-bits

These are re-exported from
[color-bits](https://github.com/romgrk/color-bits) so callers don't
need to install it directly:

- [`alpha(color, value)`](/use/color/alpha) — set the alpha channel
- [`blend(background, overlay, opacity, gamma)`](/use/color/blend) —
  alpha-composite an overlay over a background
- [`darken(color, value)`](/use/color/darken) — darken a color
- [`lighten(color, value)`](/use/color/lighten) — lighten a color
- [`getLuminance(color)`](/use/color/getLuminance) — relative
  luminance as a number
