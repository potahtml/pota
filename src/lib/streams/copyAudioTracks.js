import { removeAudioTracks } from './removeAudioTracks.js'

/**
 * Copies audio from source stream to destination stream
 *
 * @param {MediaStream} sourceStream - The source media stream
 * @param {MediaStream} destinationStream - The destination media stream
 */
export function copyAudioTracks(sourceStream, destinationStream) {
	removeAudioTracks(destinationStream)
	sourceStream.getAudioTracks().forEach(track => {
		destinationStream.addTrack(track.clone())
	})
}
