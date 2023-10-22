/**
 * Scrolls to an element
 *
 * @param {pota.Element} item - Element to scroll to
 */
export function scrollToElement(item) {
	// scrolls the content to the top
	item.scrollTop = 0
	// make sure the item inside the content is visible in case of hashes
	item.scrollIntoView({ behavior: 'auto' })
}
