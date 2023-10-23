// utils
import { isExternal } from '#urls'

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
		isExternal(node.href) ||
		(node.rel && node.rel.split(/\s/).includes('external'))
	)
		return

	e.preventDefault()

	navigate(node.href, {
		replace: node.replace,
	})
}

document.addEventListener('click', onLinkClick)
