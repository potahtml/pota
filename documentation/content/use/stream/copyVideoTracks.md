---
title: copyVideoTracks
subpath: pota/use/stream
topic: Media
desc: Replace a stream's video tracks with clones of another's.
---

# copyVideoTracks

`copyVideoTracks(sourceStream, destinationStream)` replaces the
destination's video tracks with clones of the source's. The
destination's existing video tracks are removed first (via
[`removeVideoTracks`](/use/stream/removeVideoTracks)), so calling it
twice doesn't accumulate tracks. For audio use
[`copyAudioTracks`](/use/stream/copyAudioTracks). Part of
[`pota/use/stream`](/use/stream).

## Arguments

| Argument            | Type          | Description                             |
| ------------------- | ------------- | --------------------------------------- |
| `sourceStream`      | `MediaStream` | Stream whose video tracks are cloned.   |
| `destinationStream` | `MediaStream` | Stream that receives the cloned tracks. |

**Returns:** nothing — it mutates `destinationStream` in place.

## Examples

### Swap in a camera

Capture a camera and copy its video onto a destination stream, leaving
any existing audio tracks on the destination untouched.

```jsx
import { copyVideoTracks } from 'pota/use/stream'

const cam = await navigator.mediaDevices.getUserMedia({
	video: true,
})

const output = new MediaStream()
copyVideoTracks(cam, output)
```
