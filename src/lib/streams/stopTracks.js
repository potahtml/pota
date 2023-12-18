export function stopTracks(stream) {
	stream.getAudioTracks().forEach(track => track.stop())
	stream.getVideoTracks().forEach(track => track.stop())
	stream.getTracks().forEach(track => track.stop())
}
