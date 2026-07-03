/** @jsxImportSource pota */
// REGRESSION — documentation/improvements.md: two `setCSS` bugs.
// (1) `value.replace(/class/g, …)` rewrote `class` anywhere in the
// CSS text, corrupting selectors like `.classic`. Fixed with a token
// match that skips longer words, literal `.class`/`#class`/`[class`
// references, and quote-opened strings. (2) the cache was keyed
// globally by CSS string and `addAdoptedStyleSheet` only ran on a
// cache miss, so a second (shadow) document never received the sheet.
// Fixed: adoption runs on every call (idempotent per document); the
// cache holds { id, sheet }.

import { test, $, macrotask } from '#test'
import { render } from 'pota'

await test('selectors containing "class" as substring are preserved', async expect => {
	const dispose = render(
		<div use:css="class { color: rgb(255, 0, 0) } .classic { color: rgb(0, 0, 255) }">
			<span class="classic">hi</span>
		</div>,
	)

	await macrotask()

	// the host rule works — `class` became the generated class
	expect(getComputedStyle($('div')).color).toBe('rgb(255, 0, 0)')

	// `.classic` survives the placeholder substitution
	expect(getComputedStyle($('span')).color).toBe('rgb(0, 0, 255)')

	dispose()
	// use:css stylesheets are shared/cached — clean up manually
	document.adoptedStyleSheets = []
})

await test('placeholder positions still substitute', async expect => {
	const dispose = render(
		<div use:css="class { color: rgb(255, 0, 0) } class span { color: rgb(0, 0, 255) }">
			<span>hi</span>
		</div>,
	)

	await macrotask()

	expect(getComputedStyle($('div')).color).toBe('rgb(255, 0, 0)')
	expect(getComputedStyle($('span')).color).toBe('rgb(0, 0, 255)')

	dispose()
	document.adoptedStyleSheets = []
})

await test('attribute selectors on class are preserved', async expect => {
	const dispose = render(
		<div use:css='class { color: rgb(255, 0, 0) } [class~="tag"] { color: rgb(0, 0, 255) }'>
			<span class="tag">hi</span>
		</div>,
	)

	await macrotask()

	expect(getComputedStyle($('div')).color).toBe('rgb(255, 0, 0)')
	expect(getComputedStyle($('span')).color).toBe('rgb(0, 0, 255)')

	dispose()
	document.adoptedStyleSheets = []
})

await test('cached css string reaches a second (shadow) document', async expect => {
	// first consumer: main document — cache miss, sheet adopted
	const dispose = render(
		<div use:css="class { color: rgb(0, 128, 0) }">main</div>,
	)
	await macrotask()
	expect(document.adoptedStyleSheets.length).toBe(1)

	// second consumer: same string inside a shadow root
	const host = document.createElement('div')
	document.body.appendChild(host)
	const shadow = host.attachShadow({ mode: 'open' })
	const dispose2 = render(
		<p use:css="class { color: rgb(0, 128, 0) }">shadow</p>,
		shadow,
	)
	await macrotask()

	// the generated class was added to the element…
	expect(shadow.querySelector('p').className.length > 0).toBe(true)

	// …and the shadow root adopted the (same, cached) sheet
	expect(shadow.adoptedStyleSheets.length).toBe(1)
	expect(shadow.adoptedStyleSheets[0]).toBe(
		document.adoptedStyleSheets[0],
	)

	// the main document did not get a duplicate
	expect(document.adoptedStyleSheets.length).toBe(1)

	dispose2()
	dispose()
	host.remove()
	document.adoptedStyleSheets = []
})
