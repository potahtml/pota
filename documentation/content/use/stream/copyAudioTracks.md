---
title: copyAudioTracks
subpath: pota/use/stream
topic: Media
desc: Replace a stream's audio tracks with clones of another's.
---

# copyAudioTracks

`copyAudioTracks(sourceStream, destinationStream)` replaces the
destination's audio tracks with clones of the source's. The
destination's existing audio tracks are removed first (via
[`removeAudioTracks`](/use/stream/removeAudioTracks)), so calling it
twice doesn't accumulate tracks. For video use
[`copyVideoTracks`](/use/stream/copyVideoTracks). Part of
[`pota/use/stream`](/use/stream).

## Arguments

| Argument            | Type          | Description                             |
| ------------------- | ------------- | --------------------------------------- |
| `sourceStream`      | `MediaStream` | Stream whose audio tracks are cloned.   |
| `destinationStream` | `MediaStream` | Stream that receives the cloned tracks. |

**Returns:** nothing — it mutates `destinationStream` in place.

## Examples

### Swap in a microphone

Capture a microphone and copy its audio onto a destination stream,
leaving any existing video tracks on the destination untouched.

```jsx
import { copyAudioTracks } from 'pota/use/stream'

const mic = await navigator.mediaDevices.getUserMedia({
	audio: true,
})

const output = new MediaStream()
copyAudioTracks(mic, output)
```
