import { onMount } from '../core/scheduler.js'
import { location, window } from '../lib/std.js'
import { document, querySelector } from './dom.js'
import { decodeURIComponent } from './url.js'

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
 * Scrolls to the element a hash / selector points to.
 *
 * @param {string} selector - Hash or selector to scroll to
 * @returns {boolean} True on success
 */
export function scrollToSelector(selector) {
	const item = selector ? scrollTarget(selector) : null
	if (item) {
		scrollToElement(item)
		return true
	}
	return false
}

/**
 * Resolves a hash / selector to an element. A URL fragment is matched
 * against element ids (`getElementById`), not CSS selectors, so `#id`
 * is resolved that way first — this handles ids that are valid HTML
 * but invalid CSS selectors (a leading digit, `/`, `.`, `:`). Falls
 * back to `querySelector` for arbitrary selectors.
 *
 * @param {string} selector
 * @returns {Element | null}
 */
function scrollTarget(selector) {
	if (selector[0] === '#') {
		const item = document.getElementById(
			decodeURIComponent(selector.slice(1)),
		)
		if (item) return item
	}
	try {
		// selector could be invalid
		return querySelector(document, selector)
	} catch (e) {
		return null
	}
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

/**
 * Ref factory: scrolls the element into view once it is mounted.
 *
 * @param {boolean | ScrollIntoViewOptions} [opts]
 * @url https://pota.quack.uy/use/scroll
 */
export const scrollIntoView = opts => node => {
	onMount(() => node.scrollIntoView(opts))
}
