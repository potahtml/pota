import { stopTracks } from './stopTracks.js'

/**
 * Stops all tracks of the provided stream.
 *
 * @param {(MediaStream|MediaRecorder)} stream - The stream to stop.
 */
export function stopStream(stream) {
	if (stream instanceof MediaStream) {
		stopTracks(stream)
	}
	if (stream instanceof MediaRecorder) {
		stream.stop()
	}
}
