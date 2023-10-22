import { scrollToElement } from './scrollToElement.js'

/**
 * Scrolls to element that matches the hash
 *
 * @param {string} hash - Hash to scroll to
 * @returns {boolean} True on success
 */
export function scrollToSelector(hash) {
	if (hash) {
		try {
			// selector could be invalid
			scrollToElement(document.querySelector(hash))
			return true
		} catch (e) {}
	}
	return false
}
