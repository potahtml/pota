import { scrollToSelector } from './scrollToSelector.js'
import { scrollToTop } from './scrollToTop.js'

/**
 * Scrolls to hash and in case isnt found it scrolls to the top
 *
 * @param {string} selector - Hash to scroll to
 */
export function scrollToSelectorWithFallback(selector) {
	if (!scrollToSelector(selector)) scrollToTop()
}
