import { removeVideoTracks } from './removeVideoTracks.js'

/**
 * Copies video from source stream to destination stream
 *
 * @param {MediaStream} sourceStream - The source media stream.
 * @param {MediaStream} destinationStream - The destination media stream.
 */
export function copyVideoTracks(sourceStream, destinationStream) {
	removeVideoTracks(destinationStream)
	sourceStream
		.getVideoTracks()
		.forEach(track => destinationStream.addTrack(track.clone()))
}
