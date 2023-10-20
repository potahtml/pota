/**
 * Scrolls to an element
 *
 * @param {pota.element} item - Element to scroll to
 */
export function scrollToElement(item) {
	item.scrollIntoView({ behavior: 'auto' })
}
