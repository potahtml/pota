---
title: isPlaying
subpath: pota/use/dom
topic: Internals
desc: True when a media element is actively progressing.
---

# isPlaying

`isPlaying(el)` returns `true` when a media element is actively
progressing — `currentTime > 0`, not paused, not ended, and
`readyState >= HAVE_FUTURE_DATA` (3). Use it as a one-shot in event
handlers; for reactive play state wrap a signal around `play` /
`pause` / `ended`. Part of [`pota/use/dom`](/use/dom).
