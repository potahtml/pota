---
title: removeAudioTracks
subpath: pota/use/stream
topic: Media
desc: Remove a stream's audio tracks without stopping capture.
---

# removeAudioTracks

`removeAudioTracks(stream)` removes the stream's audio tracks without
stopping the underlying capture — the tracks are detached, not
stopped. Pair it with [`copyAudioTracks`](/use/stream/copyAudioTracks)
to swap a device live, or use [`stopStream`](/use/stream/stopStream)
when you actually want to release the hardware. Part of
[`pota/use/stream`](/use/stream).

## Arguments

| Argument | Type          | Description                             |
| -------- | ------------- | --------------------------------------- |
| `stream` | `MediaStream` | Stream to detach all audio tracks from. |

**Returns:** nothing — it mutates `stream` in place.

## Examples

### Drop audio from a stream

Detach every audio track from a capture stream while leaving its video
running.

```jsx
import { removeAudioTracks } from 'pota/use/stream'

const stream = await navigator.mediaDevices.getUserMedia({
	audio: true,
	video: true,
})
removeAudioTracks(stream)
```
