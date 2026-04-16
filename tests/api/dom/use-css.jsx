/** @jsxImportSource pota */

// Tests for the `use:css` JSX directive and `CSSStyleSheet` as a
// child — both adopt a stylesheet via the document's
// `adoptedStyleSheets`.

import { $, microtask, test } from '#test'
import { render } from 'pota'
import { css } from 'pota/use/css'

await test('JSX use:css prop - adds adopted stylesheet and generated class to element', async expect => {
	const before = document.adoptedStyleSheets.length

	const dispose = render(
		<div use:css="class { color: green }">styled</div>,
	)

	await microtask()

	const el = $('div')
	// use:css generates a unique class and adds it to the element
	expect(el.className.length > 0).toBe(true)
	// a new adopted stylesheet was added
	expect(document.adoptedStyleSheets.length).toBe(before + 1)

	dispose()

	// use:css stylesheets are shared/cached — clean up manually
	document.adoptedStyleSheets = []
})

// --- CSSStyleSheet as child --------------------------------------------------

await test('CSSStyleSheet as child - adopts stylesheet to document', async expect => {
	const sheet = css`
		.test-css-child {
			color: red;
		}
	`

	const before = document.adoptedStyleSheets.length

	const dispose = render(
		<div class="test-css-child">{sheet}hello</div>,
	)

	await microtask()

	expect(document.adoptedStyleSheets.includes(sheet)).toBe(true)

	dispose()
})
