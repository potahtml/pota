---
title: stopStream
subpath: pota/use/stream
topic: Media
desc:
  Polymorphic teardown — stop a MediaStream's tracks or a
  MediaRecorder.
---

# stopStream

`stopStream(stream)` is the polymorphic teardown call: pass a
`MediaStream` (it stops every track) or a `MediaRecorder` (it calls
`recorder.stop()`). Anything else is ignored. Handy as a single line
in a `cleanup`. For lower-level forms see
[`stopTracks`](/use/stream/stopTracks) and
[`stopTrack`](/use/stream/stopTrack). Part of
[`pota/use/stream`](/use/stream).

## Arguments

| Argument | Type                           | Description                     |
| -------- | ------------------------------ | ------------------------------- |
| `stream` | `MediaStream \| MediaRecorder` | The stream or recorder to stop. |

**Returns:** nothing. A `MediaStream` has every track stopped; a
`MediaRecorder` is told to `stop()`.

## Examples

### Tear down on cleanup

Acquire a camera stream and release the hardware automatically when
the surrounding reactive scope is disposed.

```jsx
import { stopStream } from 'pota/use/stream'
import { cleanup } from 'pota'

const stream = await navigator.mediaDevices.getUserMedia({
	video: true,
})
cleanup(() => stopStream(stream))
```
