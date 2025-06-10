/**
 * Copies audio from source stream to destination stream
 *
 * @param {MediaStream} sourceStream - The source media stream
 * @param {MediaStream} destinationStream - The destination media
 *   stream
 */
export function copyAudioTracks(sourceStream, destinationStream) {
	removeAudioTracks(destinationStream)
	sourceStream
		.getAudioTracks()
		.forEach(track => destinationStream.addTrack(track.clone()))
}

/**
 * Copies video from source stream to destination stream
 *
 * @param {MediaStream} sourceStream - The source media stream.
 * @param {MediaStream} destinationStream - The destination media
 *   stream.
 */
export function copyVideoTracks(sourceStream, destinationStream) {
	removeVideoTracks(destinationStream)
	sourceStream
		.getVideoTracks()
		.forEach(track => destinationStream.addTrack(track.clone()))
}

/**
 * Removes audio tracks from a given MediaStream
 *
 * @param {MediaStream} stream - The MediaStream object from which to
 *   remove audio tracks
 */
export function removeAudioTracks(stream) {
	stream.getAudioTracks().forEach(track => stream.removeTrack(track))
}

/**
 * Removes video tracks from the provided stream.
 *
 * @param {MediaStream} stream - The media stream from which to remove
 *   video tracks.
 */
export function removeVideoTracks(stream) {
	stream.getVideoTracks().forEach(track => stream.removeTrack(track))
}

/**
 * Stops all tracks of the provided stream.
 *
 * @param {MediaStream | MediaRecorder} stream - The stream to stop.
 */
export function stopStream(stream) {
	if (stream instanceof MediaStream) {
		stopTracks(stream)
	}
	if (stream instanceof MediaRecorder) {
		stream.stop()
	}
}

/**
 * Stops a track.
 *
 * @param {MediaStreamTrack} track - The track to stop.
 */
export const stopTrack = track => track.stop()

/**
 * Stops all tracks within the provided MediaStream.
 *
 * @param {MediaStream} stream - The MediaStream object containing the
 *   tracks to be stopped.
 */
export function stopTracks(stream) {
	stream.getAudioTracks().forEach(stopTrack)
	stream.getVideoTracks().forEach(stopTrack)
	stream.getTracks().forEach(stopTrack)
}
