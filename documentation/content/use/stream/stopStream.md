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

Acquire a camera inside a component and release the hardware when the
component unmounts. If disposal happens while the permission prompt is
still pending, the late stream is stopped the moment it arrives.

```jsx
import { render, signal, cleanup } from 'pota'
import { Show } from 'pota/components'
import { stopStream } from 'pota/use/stream'

function Camera() {
	let stream
	let disposed = false

	navigator.mediaDevices.getUserMedia({ video: true }).then(s => {
		disposed ? stopStream(s) : (stream = s)
	})

	cleanup(() => {
		disposed = true
		stream && stopStream(stream)
	})

	return <p>camera live — unmount me to release it</p>
}

function App() {
	const show = signal(false)

	return (
		<div>
			<button on:click={() => show.update(v => !v)}>
				toggle camera
			</button>
			<Show when={show.read}>
				<Camera />
			</Show>
		</div>
	)
}

render(App)
```
