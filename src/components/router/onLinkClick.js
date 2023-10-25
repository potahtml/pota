// utils
import { isExternal } from '../../lib/urls/@main.js'

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
		!/^http/.test(node.href) || // when using other protocol than "http"
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
