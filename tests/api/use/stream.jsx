/** @jsxImportSource pota */

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
