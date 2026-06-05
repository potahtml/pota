---
title: recorder
subpath: pota/use/recorder
topic: Media
desc:
  Record audio or audio+video from the default input devices into an
  upload-ready Blob.
---

# recorder

Records audio (or audio + video) from the default input devices into
an upload-ready `Blob`. Designed for chat-style voice / video
messages: `start()` requests permission and begins, `await stop()`
finalizes and returns the `Blob`, `cancel()` discards. `pause()` /
`resume()` work when the browser supports them on `MediaRecorder` (all
modern ones do).

The returned controller exposes reactive signal readers so a UI can
show a recording indicator, a paused state, an elapsed-time counter, a
live mic level for a waveform or pulsing dot, and the live permission
state. The mic / camera are released as soon as recording stops, is
cancelled, or the surrounding scope is disposed — so the browser
indicator turns off promptly even on early unmount.

## Arguments

`recorder(options?)` takes a single options object.

| name           | type                               | description                                                                                                              |
| -------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `audio?`       | `boolean \| MediaTrackConstraints` | Capture audio (default `true`). Pass a constraints object (`{ echoCancellation: true }`) to refine.                      |
| `video?`       | `boolean \| MediaTrackConstraints` | Capture video (default `false`).                                                                                         |
| `mimeType?`    | `string`                           | Override the auto-picked codec. Must pass `MediaRecorder.isTypeSupported`.                                               |
| `maxDuration?` | `number`                           | Auto-stop after this many ms of _active_ recording (paused time is excluded). A pending `stop()` resolves with the blob. |

**Returns:** a controller object —

| member       | type                          | description                                                                            |
| ------------ | ----------------------------- | -------------------------------------------------------------------------------------- |
| `start()`    | `() => Promise<void>`         | Request permission and begin. Rejects on permission deny / no compatible device.       |
| `stop()`     | `() => Promise<Blob \| null>` | Stop and resolve with the recorded `Blob`, or `null` when nothing is recording.        |
| `cancel()`   | `() => void`                  | Discard the recording and release the device. A pending `stop()` resolves with `null`. |
| `pause()`    | `() => void`                  | Pause without releasing the device. No-op unless actively recording.                   |
| `resume()`   | `() => void`                  | Resume a paused recording. No-op unless paused.                                        |
| `recording`  | `() => boolean`               | Signal reader — `true` while capturing.                                                |
| `paused`     | `() => boolean`               | Signal reader — `true` while paused.                                                   |
| `duration`   | `() => number`                | Signal reader — active-recording time in ms, frozen while paused.                      |
| `amplitude`  | `() => number`                | Signal reader — live mic level (RMS in `0..1`) for waveforms / pulsing dots.           |
| `permission` | `() => RecorderPermission`    | Signal reader — `'granted' \| 'denied' \| 'prompt' \| 'unsupported'`.                  |

## Notes

- The auto-picked codec falls through a prioritized list: for audio
  `webm/opus` → `webm` → `mp4` → `ogg`; for video `webm/vp9` →
  `webm/vp8` → `webm` → `mp4`. If none is supported, `MediaRecorder`
  picks its platform default.
- `start()` rejects when permission is denied or no compatible device
  exists — `try` / `catch` it to surface the reason to the user.
- `amplitude` keeps ticking while paused (the mic stays live), so it
  doubles as a "mic is still hearing you" indicator.
- The Permissions API is queried where supported; spotty support
  (notably Safari) collapses `permission` to `'unsupported'`.

## Examples

### Voice message recorder

A minimal record / stop / cancel flow that produces a downloadable
`Blob`. The `duration` and `recording` readers drive a live label, and
the resulting object URL is shown as an `<audio>` player.

```jsx
import { render, signal } from 'pota'
import { Show } from 'pota/components'
import { recorder } from 'pota/use/recorder'

function App() {
	const r = recorder({ audio: true })
	const url = signal('')

	async function record() {
		try {
			await r.start()
		} catch (e) {
			alert('Could not start: ' + String(e))
		}
	}

	async function finish() {
		const blob = await r.stop()
		if (blob) url.write(URL.createObjectURL(blob))
	}

	return (
		<div>
			<Show
				when={r.recording}
				fallback={<button on:click={record}>Record</button>}
			>
				<button on:click={finish}>Stop</button>
				<button on:click={r.cancel}>Cancel</button>
				<span> {() => (r.duration() / 1000).toFixed(1)}s</span>
			</Show>

			<Show when={url.read}>
				<audio
					controls
					src={url.read}
				/>
			</Show>
		</div>
	)
}

render(App)
```

### Live mic level meter

Bind the `amplitude` reader to a bar's width to visualize input level
in real time. The reactive `style` width re-renders as the RMS value
updates each animation frame.

```jsx
import { render } from 'pota'
import { Show } from 'pota/components'
import { recorder } from 'pota/use/recorder'

function App() {
	const r = recorder({ audio: true })

	return (
		<div>
			<button on:click={r.start}>Start</button>
			<button on:click={r.stop}>Stop</button>

			<Show when={r.recording}>
				<div style={{ background: '#eee', width: '200px' }}>
					<div
						style={() => ({
							height: '12px',
							background: '#3a3',
							width: `${Math.round(r.amplitude() * 100)}%`,
						})}
					/>
				</div>
			</Show>
		</div>
	)
}

render(App)
```

### Pause and resume

`pause()` freezes the `duration` timer without releasing the mic;
`resume()` continues it. The buttons toggle on the `paused` reader.

```jsx
import { render } from 'pota'
import { Show } from 'pota/components'
import { recorder } from 'pota/use/recorder'

function App() {
	const r = recorder({ audio: true })

	return (
		<div>
			<button on:click={r.start}>Start</button>

			<Show when={r.recording}>
				<Show
					when={r.paused}
					fallback={<button on:click={r.pause}>Pause</button>}
				>
					<button on:click={r.resume}>Resume</button>
				</Show>
				<button on:click={r.stop}>Stop</button>
				<span> {() => (r.duration() / 1000).toFixed(1)}s</span>
			</Show>
		</div>
	)
}

render(App)
```

### Permission state and auto-stop

Surface the live `permission` state, and auto-stop after a fixed
budget of active recording via `maxDuration`.

```jsx
import { render } from 'pota'
import { recorder } from 'pota/use/recorder'

function App() {
	const r = recorder({
		audio: { echoCancellation: true },
		maxDuration: 30_000, // auto-stop after 30s of active recording
	})

	return (
		<div>
			<p>Permission: {r.permission}</p>
			<button on:click={r.start}>Record (max 30s)</button>
			<button on:click={r.stop}>Stop early</button>
		</div>
	)
}

render(App)
```
