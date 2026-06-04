---
title: stream
subpath: pota/use/stream
topic: Media
desc:
  MediaStream / MediaStreamTrack helpers — copy tracks and stop
  cleanly.
---

# `pota/use/stream`

`pota/use/stream` bundles the small `MediaStream` / `MediaStreamTrack`
ergonomic helpers you reach for when wiring up cameras, microphones,
or screen capture — copying tracks between streams and stopping things
cleanly.

## Exports

- [`copyAudioTracks(src, dst)`](/use/stream/copyAudioTracks) /
  [`copyVideoTracks(src, dst)`](/use/stream/copyVideoTracks) — replace
  the destination's tracks with clones of the source's
- [`removeAudioTracks(stream)`](/use/stream/removeAudioTracks) /
  [`removeVideoTracks(stream)`](/use/stream/removeVideoTracks) —
  remove tracks without stopping capture
- [`stopTrack(track)`](/use/stream/stopTrack) /
  [`stopTracks(stream)`](/use/stream/stopTracks) /
  [`stopStream(streamOrRecorder)`](/use/stream/stopStream) — stop
  tracks, or a whole stream / recorder
