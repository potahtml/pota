import { stopTrack } from './stopTrack.js'

/**
 * Stops all tracks within the provided MediaStream.
 *
 * @param {MediaStream} stream - The MediaStream object containing the tracks to be stopped.
 */
export function stopTracks(stream) {
	stream.getAudioTracks().forEach(stopTrack)
	stream.getVideoTracks().forEach(stopTrack)
	stream.getTracks().forEach(stopTrack)
}
