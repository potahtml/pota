/**
 * Stops all tracks within the provided MediaStream.
 *
 * @param {MediaStream} stream - The MediaStream object containing the tracks to be stopped.
 */
export function stopTracks(stream) {
	stream.getAudioTracks().forEach(track => track.stop())
	stream.getVideoTracks().forEach(track => track.stop())
	stream.getTracks().forEach(track => track.stop())
}
