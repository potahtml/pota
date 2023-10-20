import { scrollToElement } from '#scroll'

/**
 * Scrolls to element that matches the hash
 *
 * @param {string} hash - Hash to scroll to
 * @returns {boolean} True on success
 */
export function scrollToHash(hash) {
	if (hash) {
		try {
			// selector could be invalid
			const item = document.querySelector(hash)
			scrollToElement(item)
			return true
		} catch (e) {}
	}
	return false
}
