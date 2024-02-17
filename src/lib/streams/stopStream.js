/**
 * Stops all tracks of the provided stream.
 *
 * @param {(MediaStream|MediaRecorder)} stream - The stream to stop.
 */
export function stopStream(stream) {
	if (!stream) return

	/**
	 * Stops a track.
	 *
	 * @param {MediaStreamTrack} track - The track to stop.
	 */
	const stop = track => track.stop()
	if (stream instanceof MediaStream) {
		stream.getAudioTracks().forEach(stop)
		stream.getVideoTracks().forEach(stop)
		stream.getTracks().forEach(stop)
	}
	if (stream instanceof MediaRecorder) {
		stream.stop()
	}
}
