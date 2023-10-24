import { scrollToElement } from './scrollToElement.js'

/**
 * Scrolls to element that matches the hash
 *
 * @param {string} selector - Hash to scroll to
 * @returns {boolean} True on success
 */
export function scrollToSelector(selector) {
	if (selector) {
		try {
			// selector could be invalid
			const item = document.querySelector(selector)
			if (item) {
				scrollToElement(item)
				return true
			}
		} catch (e) {}
	}
	return false
}
