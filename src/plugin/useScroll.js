import {
	document,
	location,
	querySelector,
	window,
} from '../lib/std.js'

/**
 * Scrolls to an element
 *
 * @param {Element} item - Element to scroll to
 */
export function scrollToElement(item) {
	/** Scroll children of element to the top */
	item.scrollTop = 0

	/** Scroll to element */
	item.scrollIntoView(true)
}

/** Scrolls to `window.location.hash` */
export const scrollToLocationHash = () =>
	scrollToSelector(location.hash)

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
			const item = querySelector(document, selector)
			if (item) {
				scrollToElement(item)
				return true
			}
		} catch (e) {}
	}
	return false
}

/**
 * Scrolls to hash and in case isnt found it scrolls to the top
 *
 * @param {string} selector - Hash to scroll to
 */
export function scrollToSelectorWithFallback(selector) {
	if (!scrollToSelector(selector)) scrollToTop()
}

/** Scrolls to the top of the window */
export const scrollToTop = () =>
	window.scrollTo({ top: 0, behavior: 'auto' })
