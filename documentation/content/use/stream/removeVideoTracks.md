---
title: removeVideoTracks
subpath: pota/use/stream
topic: Media
desc: Remove a stream's video tracks without stopping capture.
---

# removeVideoTracks

`removeVideoTracks(stream)` removes the stream's video tracks without
stopping the underlying capture — the tracks are detached, not
stopped. Pair it with [`copyVideoTracks`](/use/stream/copyVideoTracks)
to swap a device live, or use [`stopStream`](/use/stream/stopStream)
when you actually want to release the hardware. Part of
[`pota/use/stream`](/use/stream).

## Arguments

| Argument | Type          | Description                             |
| -------- | ------------- | --------------------------------------- |
| `stream` | `MediaStream` | Stream to detach all video tracks from. |

**Returns:** nothing — it mutates `stream` in place.

## Examples

### Drop video from a stream

Detach every video track from a capture stream while leaving its audio
running.

```jsx
import { removeVideoTracks } from 'pota/use/stream'

const stream = await navigator.mediaDevices.getUserMedia({
	audio: true,
	video: true,
})
removeVideoTracks(stream)
```
