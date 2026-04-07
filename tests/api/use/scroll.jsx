/** @jsxImportSource pota */

import { test } from '#test'

import {
	scrollToElement,
	scrollToLocationHash,
	scrollToSelector,
	scrollToSelectorWithFallback,
	scrollToTop,
} from 'pota/use/scroll'

await test('scroll - scrollToElement resets scrollTop and calls scrollIntoView', expect => {
	const node = document.createElement('div')
	let calledWith

	node.scrollTop = 50
	node.scrollIntoView = value => {
		calledWith = value
	}

	scrollToElement(node)

	expect(node.scrollTop).toBe(0)
	expect(calledWith).toBe(true)
})

await test('scroll - selector helpers scroll to matching nodes or fall back to top', expect => {
	const originalScroll = window.scrollTo
	const originalHash = window.location.hash
	let topCalls = 0
	const node = document.createElement('div')
	node.id = 'target'
	node.scrollIntoView = () => {}
	document.body.appendChild(node)
	window.scrollTo = () => {
		topCalls++
	}
	history.replaceState(null, '', '#target')

	expect(scrollToSelector('#target')).toBe(true)
	expect(scrollToSelector('#missing')).toBe(false)

	scrollToLocationHash()
	scrollToSelectorWithFallback('#missing')
	scrollToTop()

	expect(topCalls).toBe(2)

	node.remove()
	window.scrollTo = originalScroll
	history.replaceState(null, '', originalHash || '#')
})
