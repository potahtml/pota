// utils
import { empty, optional } from '#std'
import { scrollToHashWithFallback } from '#scroll'
import { replaceParams } from '#urls'

// local
import { setLocation } from './location.js'
import { canNavigate } from './useBeforeLeave.js'

// navigate

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
				scrollToHashWithFallback(window.location.hash)
			}
		}
	}
}

// when the user sets the url it may pass a relative path
// this resolves it

export function navigateUser(href, options = empty()) {
	href = replaceParams(href, options.params)

	navigate(
		/^http/.test(href)
			? href
			: new URL(href, window.location.href).href,
		options,
	)
}

// component for convenience

export function Navigate(props) {
	navigateUser(props.href, props)
}
