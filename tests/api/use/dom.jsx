/** @jsxImportSource pota */

import { test } from '#test'

import {
	DocumentFragment,
	activeElement,
	addClass,
	addPart,
	createComment,
	createElement,
	createElementNS,
	createTextNode,
	createTreeWalker,
	documentElement,
	getDocumentForElement,
	getValueElement,
	hasAttribute,
	head,
	importNode,
	isConnected,
	querySelector,
	querySelectorAll,
	removeAttribute,
	removeClass,
	removePart,
	setAttribute,
	toDiff,
	tokenList,
	walkElements,
} from 'pota/use/dom'

await test('dom - bound constructors and document references are usable', expect => {
	const div = createElement('div')
	const svg = createElementNS('http://www.w3.org/2000/svg', 'svg')
	const text = createTextNode('hello')
	const comment = createComment('note')
	const fragment = new DocumentFragment()

	div.append(text, comment)
	fragment.appendChild(div)

	const clone = importNode(fragment, true)

	expect(head).toBe(document.head)
	expect(documentElement).toBe(document.documentElement)
	expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg')
	expect(clone.firstChild.textContent).toBe('hello')
})

await test('dom - class, part and attribute helpers support multiple combinations', expect => {
	const node = document.createElement('div')

	addClass(node, 'one two')
	addClass(node, ['three', 'four'])
	removeClass(node, 'two')
	removeClass(node, ['four'])
	addPart(node, 'panel')
	removePart(node, 'panel')
	setAttribute(node, 'role', 'status')

	expect(tokenList(' a   b c ')).toEqual(['a', 'b', 'c'])
	expect(node.className).toBe('one three')
	expect(node.part.contains('panel')).toBe(false)
	expect(hasAttribute(node, 'role')).toBe(true)

	removeAttribute(node, 'role')
	expect(hasAttribute(node, 'role')).toBe(false)
})

await test('dom - selectors, connectivity and owner document helpers work for live nodes', expect => {
	const host = document.createElement('div')
	host.innerHTML =
		'<section><span class="a"></span><span class="b"></span></section>'
	document.body.appendChild(host)
	const shadowHost = document.createElement('div')
	document.body.appendChild(shadowHost)
	const shadowRoot = shadowHost.attachShadow({ mode: 'open' })
	const shadowChild = document.createElement('span')
	shadowRoot.appendChild(shadowChild)

	const section = querySelector(host, 'section')
	const items = querySelectorAll(host, 'span')

	expect(section.tagName).toBe('SECTION')
	expect(items.length).toBe(2)
	expect(isConnected(items[0])).toBe(true)
	expect(activeElement()).toBe(document.activeElement)
	expect(getDocumentForElement(items[0])).toBe(document)
	expect(getDocumentForElement(shadowChild)).toBe(shadowRoot)

	host.remove()
	shadowHost.remove()
})

await test('dom - walkElements and getValueElement cover node and non-node values', expect => {
	const host = document.createElement('div')
	host.innerHTML = '<section><span></span><em></em></section>'
	const walked = walkElements(host, 3, [])
	const node = document.createElement('div')

	expect(walked.map(node => node.nodeName)).toEqual([
		'DIV',
		'SECTION',
		'SPAN',
	])
	expect(getValueElement(node)).toBe(node)
	expect(getValueElement(() => node)).toBe(node)
	expect(getValueElement(() => 'text')).toBe(undefined)
})

await test('dom - toDiff removes only nodes missing from next and supports fast clear', expect => {
	const parent = document.createElement('div')
	const one = document.createElement('span')
	const two = document.createElement('span')
	const placeholder = document.createTextNode('')
	parent.append(one, two, placeholder)

	let next = toDiff([one, two], [two], false)
	expect(next).toEqual([two])
	expect(parent.childNodes.length).toBe(2)
	expect(parent.firstChild).toBe(two)

	parent.prepend(one)
	next = toDiff([one, two], [], true)
	expect(next).toEqual([])
	expect(parent.childNodes.length).toBe(1)
	expect(parent.lastChild).toBe(placeholder)
})

// --- createTreeWalker --------------------------------------------------------

await test('dom - createTreeWalker is a bound function that creates a working walker', expect => {
	expect(typeof createTreeWalker).toBe('function')

	const host = document.createElement('div')
	host.innerHTML = '<p><span>a</span></p><p>b</p>'

	const walker = createTreeWalker(
		host,
		1, // NodeFilter.SHOW_ELEMENT
	)

	const names = []
	let node
	while ((node = walker.nextNode())) {
		names.push(node.tagName)
	}
	expect(names).toEqual(['P', 'SPAN', 'P'])
})

// --- tokenList edge cases ----------------------------------------------------

await test('dom - tokenList returns empty array for null/undefined/empty', expect => {
	expect(tokenList(null)).toEqual([])
	expect(tokenList(undefined)).toEqual([])
	expect(tokenList('')).toEqual([])
})

await test('dom - tokenList trims and splits by arbitrary whitespace', expect => {
	expect(tokenList('  a\t b  c ')).toEqual(['a', 'b', 'c'])
})

// --- toDiff edge cases -------------------------------------------------------

await test('dom - toDiff with empty prev returns next unchanged', expect => {
	const a = document.createElement('span')
	const result = toDiff([], [a])
	expect(result).toEqual([a])
})

await test('dom - toDiff removes each node when no fast-clear path', expect => {
	const parent = document.createElement('div')
	const a = document.createElement('span')
	const b = document.createElement('span')
	const extra = document.createElement('em')
	parent.append(a, b, extra)

	// extra prevents fast-clear (prev.length + 1 !== parent.childNodes.length)
	const result = toDiff([a, b], [])
	expect(result).toEqual([])
	expect(parent.childNodes.length).toBe(1) // only extra remains
	expect(parent.firstChild).toBe(extra)
})

// --- isConnected and getDocumentForElement for disconnected -------------------

await test('dom - isConnected returns false for detached nodes', expect => {
	const detached = document.createElement('div')
	expect(isConnected(detached)).toBe(false)
})

await test('dom - getDocumentForElement returns ownerDocument for disconnected nodes', expect => {
	const detached = document.createElement('div')
	expect(getDocumentForElement(detached)).toBe(document)
})

// --- walkElements deeper tree ------------------------------------------------

await test('dom - walkElements with Infinity collects all nested elements', expect => {
	const host = document.createElement('div')
	host.innerHTML = '<ul><li><span>a</span></li><li>b</li></ul>'
	const names = walkElements(host).map(n => n.tagName)
	expect(names).toEqual(['DIV', 'UL', 'LI', 'SPAN', 'LI'])
})
