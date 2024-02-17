/**
 * Removes audio tracks from a given MediaStream
 *
 * @param {MediaStream} stream - The MediaStream object from which to remove audio tracks
 */
export function removeAudio(stream) {
	if (stream) {
		stream.getAudioTracks().forEach(track => {
			stream.removeTrack(track)
		})
	}
}
