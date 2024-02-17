import { removeVideo } from './removeVideo.js'

/**
 * Copies video from source stream to destination stream
 *
 * @param {MediaStream} sourceStream - The source media stream.
 * @param {MediaStream} destinationStream - The destination media stream.
 */
export function copyVideo(sourceStream, destinationStream) {
	removeVideo(destinationStream)
	sourceStream.getVideoTracks().forEach(track => {
		destinationStream.addTrack(track.clone())
	})
}
