import { getPropsData } from '#main'

// utils
import { optional } from '#std'
import { origin } from '#urls'

// local
import { navigate } from './navigate.js'

function onLinkClick(e) {
	if (
		e.defaultPrevented ||
		e.button !== 0 ||
		e.metaKey ||
		e.altKey ||
		e.ctrlKey ||
		e.shiftKey
	)
		return

	// find link
	const node = e
		.composedPath()
		.find(item => item instanceof HTMLAnchorElement)

	// validate
	if (
		!node ||
		!node.href ||
		node.download ||
		node.target ||
		// origin could be http://example.net and link could be http://example.net.ha.com
		(node.href + '/').indexOf(origin + '/') !== 0 ||
		(node.rel && node.rel.split(/\s/).includes('external'))
	)
		return

	e.preventDefault()

	const options = getPropsData(node)

	navigate(node.href, {
		replace: options.replace,
		scroll: optional(options.scroll),
	})
}

document.addEventListener('click', onLinkClick)
