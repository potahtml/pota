/** @jsxImportSource pota */
// BUG CONFIRMATION — documentation/improvements.md: two `setCSS` bugs.
// (1) `value.replace(/class/g, '.' + id)` rewrites `class` anywhere in
// the CSS text, corrupting selectors like `.classic`. (2) the cache is
// keyed globally by CSS string and `addAdoptedStyleSheet` only runs on
// a cache miss, so a second (shadow) document never receives the
// sheet. Asserts the CURRENT buggy behavior.

import { test, $, macrotask } from '#test'
import { render } from 'pota'

await test('CONFIRM - selectors containing "class" as substring are corrupted', async expect => {
	const dispose = render(
		<div use:css="class { color: rgb(255, 0, 0) } .classic { color: rgb(0, 0, 255) }">
			<span class="classic">hi</span>
		</div>,
	)

	await macrotask()

	// the host rule works — `class` became the generated class
	expect(getComputedStyle($('div')).color).toBe('rgb(255, 0, 0)')

	// BUG: `.classic` was rewritten to `..c<id>ic`, an invalid
	// selector — the rule is dropped and the span inherits red
	expect(getComputedStyle($('span')).color).toBe('rgb(255, 0, 0)')
	// FIXED: expect(getComputedStyle($('span')).color).toBe('rgb(0, 0, 255)')

	dispose()
	// use:css stylesheets are shared/cached — clean up manually
	document.adoptedStyleSheets = []
})

await test('CONFIRM - cached css string never reaches a second (shadow) document', async expect => {
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

	// BUG: …but the sheet was never adopted by the shadow root — the
	// global cache hit skipped addAdoptedStyleSheet entirely
	expect(shadow.adoptedStyleSheets.length).toBe(0)
	// FIXED: expect(shadow.adoptedStyleSheets.length).toBe(1)

	dispose2()
	dispose()
	host.remove()
	document.adoptedStyleSheets = []
})
