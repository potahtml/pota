import { stopTrack } from './stopTrack.js'

/**
 * Stops all tracks of the provided stream.
 *
 * @param {(MediaStream|MediaRecorder)} stream - The stream to stop.
 */
export function stopStream(stream) {
	if (!stream) return

	if (stream instanceof MediaStream) {
		stream.getAudioTracks().forEach(stopTrack)
		stream.getVideoTracks().forEach(stopTrack)
		stream.getTracks().forEach(stopTrack)
	}
	if (stream instanceof MediaRecorder) {
		stream.stop()
	}
}
