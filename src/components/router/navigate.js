// utils
import { empty, optional } from '../../lib/std/@main.js'
import { scrollToSelectorWithFallback } from '../../lib/scroll/@main.js'
import { replaceParams } from '../../lib/urls/@main.js'

// local
import { setLocation } from './location.js'
import { canNavigate } from './useBeforeLeave.js'

/**
 * Navigates to a new location
 *
 * @param {string} href
 * @param {{ scroll?: boolean; replace?: boolean }} options
 */
export async function navigate(href, options = empty()) {
	if (window.location.href !== href) {
		if (await canNavigate(href)) {
			if (options.replace) {
				window.history.replaceState(null, '', href)
			} else {
				window.history.pushState(null, '', href)
			}
			setLocation(window.location)

			if (optional(options.scroll)) {
				scrollToSelectorWithFallback(window.location.hash)
			}
		}
	}
}

/**
 * Navigates to a new location programmatically
 *
 * @param {string} href
 * @param {{
 * 	params?: object
 * 	scroll?: boolean
 * 	replace?: boolean
 * }} options
 */
export function navigateUser(href, options = empty()) {
	// when the user sets the url it may pass a relative path
	// this makes it absolute
	href = replaceParams(href, options.params)

	navigate(
		/^http/.test(href)
			? href
			: new URL(href, window.location.href).href,
		options,
	)
}

/**
 * Navigates to a new location from JSX
 *
 * @param {{
 * 	href: string
 * 	scroll?: boolean
 * 	replace?: boolean
 * 	params?: object
 * }} props
 */
export const Navigate = props => navigateUser(props.href, props)
