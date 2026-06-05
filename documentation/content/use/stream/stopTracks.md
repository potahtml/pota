---
title: stopTracks
subpath: pota/use/stream
topic: Media
desc: Stop every audio and video track on a MediaStream.
---

# stopTracks

`stopTracks(stream)` stops every audio and video track on a
`MediaStream`. For a single track use
[`stopTrack`](/use/stream/stopTrack); to also accept a `MediaRecorder`
use [`stopStream`](/use/stream/stopStream). Part of
[`pota/use/stream`](/use/stream).

## Examples

### Stop a whole stream

Stop every audio and video track on a stream, releasing the camera and
microphone.

```jsx
import { stopTracks } from 'pota/use/stream'

const stream = await navigator.mediaDevices.getUserMedia({
	audio: true,
	video: true,
})
stopTracks(stream)
```
