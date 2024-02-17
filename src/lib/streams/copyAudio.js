import { removeAudio } from './removeAudio.js'

/**
 * Copies audio from source stream to destination stream
 *
 * @param {MediaStream} sourceStream - The source media stream
 * @param {MediaStream} destinationStream - The destination media stream
 */
export function copyAudio(sourceStream, destinationStream) {
	removeAudio(destinationStream)
	sourceStream.getAudioTracks().forEach(track => {
		destinationStream.addTrack(track.clone())
	})
}
