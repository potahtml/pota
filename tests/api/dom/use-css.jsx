/** @jsxImportSource pota */

// Tests for the `use:css` JSX directive and `CSSStyleSheet` as a
// child — both adopt a stylesheet via the document's
// `adoptedStyleSheets`.

import { $, $$, microtask, test } from '#test'
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

// --- same css string on two elements shares the stylesheet ----------

await test('use:css - identical strings share the generated stylesheet and class', async expect => {
	document.adoptedStyleSheets = []

	const dispose = render(
		<>
			<p use:css="class { color: teal }">a</p>
			<p use:css="class { color: teal }">b</p>
		</>,
	)

	await microtask()

	const paragraphs = $$('p')
	// Both elements end up with the SAME generated class name — the
	// `withState` cache in `props/css.js` keys on the css source string.
	expect(paragraphs[0].className).toBe(paragraphs[1].className)
	// Only one stylesheet was adopted, not one per element.
	expect(document.adoptedStyleSheets.length).toBe(1)

	dispose()
	document.adoptedStyleSheets = []
})

// --- different css strings produce different classes/sheets ---------

await test('use:css - different strings produce distinct classes and sheets', async expect => {
	document.adoptedStyleSheets = []

	const dispose = render(
		<>
			<p use:css="class { color: red }">one</p>
			<p use:css="class { color: blue }">two</p>
		</>,
	)

	await microtask()

	const paragraphs = $$('p')
	expect(paragraphs[0].className).not.toBe(paragraphs[1].className)
	expect(document.adoptedStyleSheets.length).toBe(2)

	dispose()
	document.adoptedStyleSheets = []
})

// --- empty use:css value is a no-op ---------------------------------

await test('use:css - empty string is a no-op', async expect => {
	document.adoptedStyleSheets = []

	const dispose = render(<p use:css="">nothing</p>)

	await microtask()

	// Falsy value path in `props/css.js` short-circuits before adding
	// a class or adopting a sheet.
	expect($('p').className).toBe('')
	expect(document.adoptedStyleSheets.length).toBe(0)

	dispose()
})
