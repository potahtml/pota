/**
 * Scrolls to an element
 *
 * @param {Elements} item - Element to scroll to
 */
export function scrollToElement(item) {
	/** Scroll children of element to the top */
	item.scrollTop = 0

	/** Scroll to element */
	item.scrollIntoView(true)
}
