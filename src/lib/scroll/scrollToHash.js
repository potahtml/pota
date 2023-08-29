import { scrollToElement } from '#scroll'

export function scrollToHash(hash) {
	if (hash) {
		try {
			// selector could be invalid
			const item = document.querySelector(hash)
			scrollToElement(item)
			return true
		} catch (e) {
			return false
		}
	}
}
