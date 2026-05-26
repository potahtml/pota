import { cleanup, signal } from '../lib/reactive.js'
import {
	cancelAnimationFrame,
	navigator,
	requestAnimationFrame,
} from '../lib/std.js'
import { stopTracks } from './stream.js'

/**
 * Candidate `mimeType`s in priority order for the audio-only and
 * audio+video paths. The first `isTypeSupported` match wins. Falling
 * through returns `undefined`, which makes `MediaRecorder` pick its
 * platform default.
 *
 * @param {boolean} video
 * @returns {string | undefined}
 */
function pickMimeType(video) {
	const candidates = video
		? [
				'video/webm;codecs=vp9,opus',
				'video/webm;codecs=vp8,opus',
				'video/webm',
				'video/mp4',
			]
		: [
				'audio/webm;codecs=opus',
				'audio/webm',
				'audio/mp4',
				'audio/ogg',
			]
	for (const t of candidates) {
		if (MediaRecorder.isTypeSupported(t)) return t
	}
	return undefined
}

/**
 * @typedef {'granted' | 'denied' | 'prompt' | 'unsupported'}
 *   RecorderPermission
 */

/**
 * Records audio (or audio + video) from the default input devices.
 * Designed for chat-style voice / video messages: call `start()` to
 * request permission and begin, `await stop()` to finalize and get a
 * `Blob` ready to upload, or `cancel()` to discard. `pause()` and
 * `resume()` are supported when the browser implements them on
 * `MediaRecorder` (all modern ones do).
 *
 * The returned controller is driven by reactive signals so UIs can
 * show a "recording" indicator (`recording`), a "paused" state, an
 * elapsed-time counter (`duration`, in ms, frozen while paused), a
 * live mic level for a waveform or pulsing dot (`amplitude`, RMS in
 * `0..1`), and the current permission state for the requested
 * devices (`permission`).
 *
 * The mic / camera are released as soon as recording stops, is
 * cancelled, or the surrounding scope is disposed — so the browser
 * indicator turns off promptly even on early unmount.
 *
 * @param {{
 * 	audio?: boolean | MediaTrackConstraints
 * 	video?: boolean | MediaTrackConstraints
 * 	mimeType?: string
 * 	maxDuration?: number
 * }} [options]
 *   - `audio`: capture audio (default `true`). Pass a constraints
 *       object (e.g. `{ echoCancellation: true }`) to refine.
 *   - `video`: capture video (default `false`).
 *   - `mimeType`: override the auto-picked codec. Must pass
 *       `MediaRecorder.isTypeSupported`.
 *   - `maxDuration`: auto-stop after this many ms of *active*
 *       recording (paused time doesn't count). The pending `stop()`
 *       promise (if any) resolves with the captured blob.
 * @url https://pota.quack.uy/use/recorder
 */
export function recorder(options = {}) {
	const {
		audio = true,
		video = false,
		mimeType,
		maxDuration,
	} = options

	const recording = signal(false)
	const paused = signal(false)
	const duration = signal(0)
	const amplitude = signal(0)
	const permission = signal(
		/** @type {RecorderPermission} */ ('prompt'),
	)

	/** @type {MediaStream | null} */
	let stream = null
	/** @type {MediaRecorder | null} */
	let rec = null
	/** @type {Blob[]} */
	let chunks = []
	/** @type {AudioContext | null} */
	let audioCtx = null
	let durationId = 0
	let amplitudeId = 0
	let maxId = 0
	// Active-recording time is `elapsed + (running ? now - resumedAt : 0)`.
	// On pause we fold the running slice into `elapsed` and freeze the
	// timer; on resume we reset `resumedAt`. `maxDuration` is scheduled
	// against the remaining active budget so paused time is excluded.
	let elapsed = 0
	let resumedAt = 0
	/** @type {((blob: Blob | null) => void) | null} */
	let pendingStop = null
	/** @type {(() => void) | null} */
	let detachPermission = null
	let disposed = false

	function startDurationTimer() {
		durationId = setInterval(() => {
			duration.write(elapsed + performance.now() - resumedAt)
		}, 100)
	}

	function teardown() {
		clearInterval(durationId)
		durationId = 0
		cancelAnimationFrame(amplitudeId)
		amplitudeId = 0
		clearTimeout(maxId)
		maxId = 0
		if (audioCtx) {
			audioCtx.close()
			audioCtx = null
		}
		if (stream) {
			stopTracks(stream)
			stream = null
		}
		rec = null
		elapsed = 0
		recording.write(false)
		paused.write(false)
		amplitude.write(0)
	}

	/**
	 * Starts capture. Resolves once `MediaRecorder` is running.
	 * Rejects if permission is denied or no compatible device exists
	 * — callers should `try`/`catch` to surface that to the user.
	 *
	 * @returns {Promise<void>}
	 */
	async function start() {
		if (rec) return
		stream = await navigator.mediaDevices.getUserMedia({
			audio,
			video,
		})
		const type = mimeType ?? pickMimeType(!!video)
		rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined)
		chunks = []
		rec.ondataavailable = e => {
			if (e.data && e.data.size) chunks.push(e.data)
		}
		rec.onstop = () => {
			// `rec.mimeType` reflects what the browser actually used,
			// which can differ from the requested `type` (e.g. when the
			// constructor was given `undefined`).
			const finalType = rec ? rec.mimeType : type || ''
			const blob = new Blob(chunks, { type: finalType })
			const resolve = pendingStop
			pendingStop = null
			teardown()
			if (resolve) resolve(blob)
		}
		rec.start()

		elapsed = 0
		resumedAt = performance.now()
		duration.write(0)
		recording.write(true)
		paused.write(false)
		startDurationTimer()
		if (audio) attachAmplitude(stream)
		if (maxDuration) {
			maxId = setTimeout(stop, maxDuration)
		}
	}

	/** @param {MediaStream} src */
	function attachAmplitude(src) {
		audioCtx = new AudioContext()
		const node = audioCtx.createMediaStreamSource(src)
		const analyser = audioCtx.createAnalyser()
		analyser.fftSize = 256
		node.connect(analyser)
		const data = new Uint8Array(analyser.frequencyBinCount)
		const tick = () => {
			analyser.getByteTimeDomainData(data)
			let sum = 0
			for (let i = 0; i < data.length; i++) {
				const v = (data[i] - 128) / 128
				sum += v * v
			}
			amplitude.write(Math.sqrt(sum / data.length))
			amplitudeId = requestAnimationFrame(tick)
		}
		amplitudeId = requestAnimationFrame(tick)
	}

	/**
	 * Pauses capture without releasing the device. The `duration`
	 * timer and the `maxDuration` countdown freeze; `amplitude`
	 * keeps ticking since the mic stays live (useful as a "mic is
	 * still hearing you" indicator). No-op unless actively
	 * recording.
	 */
	function pause() {
		const r = rec
		if (!r || r.state !== 'recording') return
		r.pause()
		elapsed += performance.now() - resumedAt
		duration.write(elapsed)
		clearInterval(durationId)
		durationId = 0
		if (maxId) {
			clearTimeout(maxId)
			maxId = 0
		}
		paused.write(true)
	}

	/** Resumes a paused recording. No-op unless paused. */
	function resume() {
		const r = rec
		if (!r || r.state !== 'paused') return
		r.resume()
		resumedAt = performance.now()
		startDurationTimer()
		if (maxDuration) {
			maxId = setTimeout(stop, Math.max(0, maxDuration - elapsed))
		}
		paused.write(false)
	}

	/**
	 * Stops capture and resolves with the recorded `Blob`. Resolves
	 * with `null` if no recording is active.
	 *
	 * @returns {Promise<Blob | null>}
	 */
	function stop() {
		const r = rec
		if (!r || r.state === 'inactive') {
			return Promise.resolve(null)
		}
		return new Promise(resolve => {
			pendingStop = resolve
			r.stop()
		})
	}

	/**
	 * Discards the recording and releases the device. Any pending
	 * `stop()` promise resolves with `null`. Safe to call when not
	 * recording.
	 */
	function cancel() {
		const r = rec
		if (!r) return
		// Detach handlers before stopping so the final `dataavailable`
		// / `stop` events can't resolve the pending promise or push
		// trailing chunks into the discarded buffer.
		r.ondataavailable = null
		r.onstop = null
		if (r.state !== 'inactive') r.stop()
		chunks = []
		const resolve = pendingStop
		pendingStop = null
		teardown()
		if (resolve) resolve(null)
	}

	// Permissions API support is uneven across browsers (Safari in
	// particular has spotty `microphone` / `camera` query support),
	// so any failure collapses to `'unsupported'`. We query both
	// requested device classes and surface the most-restrictive
	// state: any 'denied' → 'denied', else any 'prompt' → 'prompt',
	// else 'granted'.
	async function watchPermission() {
		if (!navigator.permissions) {
			permission.write('unsupported')
			return
		}
		try {
			const names = []
			if (audio) names.push('microphone')
			if (video) names.push('camera')
			const statuses = await Promise.all(
				names.map(name =>
					navigator.permissions.query({
						name: /** @type {PermissionName} */ (name),
					}),
				),
			)
			if (disposed) return
			const update = () => {
				const states = statuses.map(s => s.state)
				if (states.includes('denied')) permission.write('denied')
				else if (states.includes('prompt'))
					permission.write('prompt')
				else permission.write('granted')
			}
			update()
			for (const s of statuses) s.addEventListener('change', update)
			detachPermission = () => {
				for (const s of statuses) {
					s.removeEventListener('change', update)
				}
			}
		} catch {
			permission.write('unsupported')
		}
	}
	watchPermission()

	cleanup(() => {
		disposed = true
		if (detachPermission) {
			detachPermission()
			detachPermission = null
		}
		cancel()
	})

	return {
		start,
		stop,
		cancel,
		pause,
		resume,
		recording: recording.read,
		paused: paused.read,
		duration: duration.read,
		amplitude: amplitude.read,
		permission: permission.read,
	}
}
