/** @jsxImportSource pota */
// Tests for pota/use/stream: copy/remove audio/video tracks,
// stopTrack, stopTracks, and stopStream.

import { test } from '#test'

import {
	copyAudioTracks,
	copyVideoTracks,
	removeAudioTracks,
	removeVideoTracks,
	stopStream,
	stopTrack,
	stopTracks,
} from 'pota/use/stream'

await test('stream - copy and remove helpers operate on audio and video tracks', expect => {
	const sourceAudio = {
		id: 'a1',
		kind: 'audio',
		stop() {},
		clone() {
			return {
				id: 'a1-clone',
				kind: 'audio',
				stop() {},
				clone: this.clone,
			}
		},
	}
	const sourceVideo = {
		id: 'v1',
		kind: 'video',
		stop() {},
		clone() {
			return {
				id: 'v1-clone',
				kind: 'video',
				stop() {},
				clone: this.clone,
			}
		},
	}
	const source = {
		audio: [sourceAudio],
		video: [sourceVideo],
		getAudioTracks() {
			return this.audio
		},
		getVideoTracks() {
			return this.video
		},
	}
	const destination = {
		audio: [
			{
				id: 'old-a',
				kind: 'audio',
			},
		],
		video: [
			{
				id: 'old-v',
				kind: 'video',
			},
		],
		getAudioTracks() {
			return this.audio
		},
		getVideoTracks() {
			return this.video
		},
		addTrack(value) {
			value.kind === 'audio'
				? this.audio.push(value)
				: this.video.push(value)
		},
		removeTrack(value) {
			this.audio = this.audio.filter(item => item !== value)
			this.video = this.video.filter(item => item !== value)
		},
	}

	copyAudioTracks(source, destination)
	copyVideoTracks(source, destination)

	expect(destination.getAudioTracks().map(track => track.id)).toEqual(
		['a1-clone'],
	)
	expect(destination.getVideoTracks().map(track => track.id)).toEqual(
		['v1-clone'],
	)

	removeAudioTracks(destination)
	removeVideoTracks(destination)

	expect(destination.getAudioTracks()).toEqual([])
	expect(destination.getVideoTracks()).toEqual([])
})

await test('stream - stop helpers stop tracks and support MediaRecorder-like objects', expect => {
	const audio = {
		id: 'a1',
		kind: 'audio',
		stopped: 0,
		stop() {
			this.stopped++
		},
	}
	const video = {
		id: 'v1',
		kind: 'video',
		stopped: 0,
		stop() {
			this.stopped++
		},
	}
	const media = {
		audio: [audio],
		video: [video],
		getAudioTracks() {
			return this.audio
		},
		getVideoTracks() {
			return this.video
		},
		getTracks() {
			return [...this.audio, ...this.video]
		},
	}
	const recorder = {
		stopped: 0,
		stop() {
			this.stopped++
		},
	}

	stopTrack(audio)
	expect(audio.stopped).toBe(1)

	stopTracks(media)
	expect(audio.stopped >= 2).toBe(true)
	expect(video.stopped >= 1).toBe(true)

	const OriginalMediaStream = globalThis.MediaStream
	const OriginalMediaRecorder = globalThis.MediaRecorder

	globalThis.MediaStream = function MediaStream() {}
	globalThis.MediaRecorder = function MediaRecorder() {}
	Object.setPrototypeOf(media, globalThis.MediaStream.prototype)
	Object.setPrototypeOf(recorder, globalThis.MediaRecorder.prototype)

	stopStream(media)
	stopStream(recorder)

	expect(recorder.stopped).toBe(1)

	globalThis.MediaStream = OriginalMediaStream
	globalThis.MediaRecorder = OriginalMediaRecorder
})

// --- copy into an empty destination ---------------------------------------

await test('stream - copyAudioTracks into empty destination adds the cloned track', expect => {
	const clone = {
		id: 'cloned',
		kind: 'audio',
		stop() {},
	}
	const source = {
		getAudioTracks() {
			return [
				{
					id: 'src',
					kind: 'audio',
					clone() {
						return clone
					},
				},
			]
		},
	}
	const destination = {
		audio: [],
		getAudioTracks() {
			return this.audio
		},
		addTrack(t) {
			this.audio.push(t)
		},
		removeTrack(t) {
			this.audio = this.audio.filter(a => a !== t)
		},
	}

	copyAudioTracks(source, destination)

	expect(destination.audio.length).toBe(1)
	expect(destination.audio[0]).toBe(clone)
})

// --- removeAudioTracks when no audio tracks exist -------------------------

await test('stream - removeAudioTracks on empty stream is a no-op', expect => {
	let removed = 0
	const stream = {
		getAudioTracks() {
			return []
		},
		removeTrack() {
			removed++
		},
	}

	expect(() => removeAudioTracks(stream)).not.toThrow()
	expect(removed).toBe(0)
})

// --- stopStream with a plain non-MediaStream value is a no-op ------------

await test('stream - stopStream with a plain object not inheriting from MediaStream is a no-op', expect => {
	const plain = { getTracks: () => [] }

	// plain objects don't inherit from MediaStream/MediaRecorder so
	// stopStream silently skips
	expect(() => stopStream(plain)).not.toThrow()
})

// --- stopTracks when all arrays are empty --------------------------------

await test('stream - stopTracks on empty stream is a no-op', expect => {
	const stream = {
		getAudioTracks() {
			return []
		},
		getVideoTracks() {
			return []
		},
		getTracks() {
			return []
		},
	}

	expect(() => stopTracks(stream)).not.toThrow()
})
