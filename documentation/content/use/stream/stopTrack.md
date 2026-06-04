---
title: stopTrack
subpath: pota/use/stream
topic: Media
desc: Stop a single MediaStreamTrack.
---

# stopTrack

`stopTrack(track)` calls `track.stop()` on a single
`MediaStreamTrack`. To stop every track on a stream use
[`stopTracks`](/use/stream/stopTracks), or the polymorphic
[`stopStream`](/use/stream/stopStream). Part of
[`pota/use/stream`](/use/stream).

## Examples

### Stop one track

Stop a single track pulled off a stream, leaving the others running.

```jsx
import { stopTrack } from 'pota/use/stream'

stopTrack(stream.getVideoTracks()[0])
```
