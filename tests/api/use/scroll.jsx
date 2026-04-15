/** @jsxImportSource pota */
// Tests for pota/use/scroll: scrollToElement, scrollToSelector,
// scrollToSelectorWithFallback, scrollToLocationHash, scrollToTop.

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

await test('scroll - scrollToSelector returns false for invalid selectors', expect => {
	expect(scrollToSelector('[invalid')).toBe(false)
})

await test('scroll - scrollToSelectorWithFallback scrolls to element when found', expect => {
	const node = document.createElement('div')
	node.id = 'fallback-target'
	let scrolled = false
	node.scrollIntoView = () => {
		scrolled = true
	}
	document.body.append(node)

	scrollToSelectorWithFallback('#fallback-target')

	expect(scrolled).toBe(true)

	node.remove()
})

await test('scroll - scrollToLocationHash scrolls to element matching current hash', expect => {
	const node = document.createElement('div')
	node.id = 'hash-scroll-target'
	let scrolled = false
	node.scrollIntoView = () => {
		scrolled = true
	}
	document.body.append(node)

	const originalHash = window.location.hash

	// baseline: not scrolled yet
	expect(scrolled).toBe(false)

	history.replaceState(null, '', '#hash-scroll-target')

	scrollToLocationHash()

	expect(scrolled).toBe(true)

	node.remove()
	history.replaceState(null, '', originalHash || '#')
})

// --- scrollToSelector with empty string returns false ---------------

await test('scroll - scrollToSelector returns false for empty selector', expect => {
	expect(scrollToSelector('')).toBe(false)
})

// --- scrollToSelector with null returns false ----------------------

await test('scroll - scrollToSelector returns false for null', expect => {
	expect(scrollToSelector(null)).toBe(false)
})

// --- scrollToTop calls window.scrollTo with expected options -------

await test('scroll - scrollToTop passes top=0 and auto behavior', expect => {
	const originalScroll = window.scrollTo
	/** @type {any} */
	let received

	window.scrollTo = options => {
		received = options
	}

	scrollToTop()

	expect(received.top).toBe(0)
	expect(received.behavior).toBe('auto')

	window.scrollTo = originalScroll
})
