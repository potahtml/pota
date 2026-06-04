---
title: favicon
subpath: pota/use/favicon
topic: Browser
desc: Draw a notification badge on top of the document favicon.
---

# `pota/use/favicon`

Draws a notification badge on top of the document favicon — for
unread-count indicators, build-status dots, and "you have a message"
cues that show in the tab even when the user has switched away.

## Exports

- [`setFaviconBadge(badge?, options?)`](/use/favicon/setFaviconBadge)
  — one-shot; returns a `Promise`.
- [`useFaviconBadge(badge, options?)`](/use/favicon/useFaviconBadge) —
  reactive; redraws when an accessor's value changes.

## How it works

The module snapshots the page's `<link rel="icon">` the first time
it's called and draws every subsequent badge over that snapshot — so
repeated calls don't bake earlier badges into the base image. The icon
is rasterized into a 16×16 canvas; `toDataURL()` sets `link.href`.

It is a no-op when no `<link rel="icon">` is present, when the icon
fails to load, or when the canvas is tainted (cross-origin icon
without CORS) — the existing favicon is left untouched rather than
throwing.

## Options

Both exports accept the same options object.

| name          | type     | description                          |
| ------------- | -------- | ------------------------------------ |
| `background?` | `string` | badge fill color (default `'red'`)   |
| `color?`      | `string` | badge text color (default `'white'`) |
