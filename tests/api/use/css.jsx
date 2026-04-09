/** @jsxImportSource pota */
// Tests for pota/use/css: css tagged template, sheet caching,
// adopted stylesheet add/remove, external fetch caching.

import { test, macrotask } from '#test'

import {
	CSSStyleSheet,
	adoptedStyleSheets,
	addAdoptedStyleSheet,
	addStyleSheetExternal,
	addStyleSheets,
	css,
	getAdoptedStyleSheets,
	removeAdoptedStyleSheet,
	sheet,
} from 'pota/use/css'

await test('css - css and sheet create cached CSSStyleSheet instances', expect => {
	const first = sheet('div { color: red; }')
	const second = sheet('div { color: red; }')
	const tagged = css`
		span {
			color: blue;
		}
	`

	expect(first instanceof CSSStyleSheet).toBe(true)
	expect(second).toBe(first)
	expect(tagged instanceof CSSStyleSheet).toBe(true)
	expect(adoptedStyleSheets).toBe(document.adoptedStyleSheets)
})

await test('css - add and remove adopted stylesheets work on shadow roots', expect => {
	const host = document.createElement('div')
	const root = host.attachShadow({ mode: 'open' })
	const styleSheet = sheet(':host { color: red; }')

	addAdoptedStyleSheet(root, styleSheet)
	expect(getAdoptedStyleSheets(root).includes(styleSheet)).toBe(true)

	removeAdoptedStyleSheet(root, styleSheet)
	expect(getAdoptedStyleSheets(root).includes(styleSheet)).toBe(false)
})

await test('css - addStyleSheets accepts direct sheets and inline css text', async expect => {
	const host = document.createElement('div')
	const root = host.attachShadow({ mode: 'open' })
	const direct = sheet(':host { display: block; }')

	addStyleSheets(root, [direct, ':host { color: green; }'])
	await macrotask()

	expect(getAdoptedStyleSheets(root).length).toBe(2)
	expect(getAdoptedStyleSheets(root)[0]).toBe(direct)
})

await test('css - addStyleSheetExternal caches inline stylesheet text', async expect => {
	const hostA = document.createElement('div')
	const hostB = document.createElement('div')
	const rootA = hostA.attachShadow({ mode: 'open' })
	const rootB = hostB.attachShadow({ mode: 'open' })

	addStyleSheetExternal(rootA, ':host { color: purple; }')
	addStyleSheetExternal(rootB, ':host { color: purple; }')

	await macrotask()

	expect(getAdoptedStyleSheets(rootA).length).toBe(1)
	expect(getAdoptedStyleSheets(rootB).length).toBe(1)
	expect(getAdoptedStyleSheets(rootA)[0]).toBe(
		getAdoptedStyleSheets(rootB)[0],
	)
})

await test('css - addStyleSheetExternal fetches remote css once and reuses the sheet', async expect => {
	const originalFetch = globalThis.fetch
	const hostA = document.createElement('div')
	const hostB = document.createElement('div')
	const rootA = hostA.attachShadow({ mode: 'open' })
	const rootB = hostB.attachShadow({ mode: 'open' })
	let calls = 0

	globalThis.fetch = url => {
		calls++
		return Promise.resolve({
			text: () =>
				Promise.resolve(`/* ${url} */ :host { color: red; }`),
		})
	}

	addStyleSheetExternal(rootA, 'http://example.test/a.css')
	addStyleSheetExternal(rootB, 'http://example.test/a.css')

	await macrotask()

	expect(calls).toBe(1)
	expect(getAdoptedStyleSheets(rootA)[0]).toBe(
		getAdoptedStyleSheets(rootB)[0],
	)

	globalThis.fetch = originalFetch
})

await test('css - css tagged template returns a CSSStyleSheet', expect => {
	const s = css`
		p {
			color: red;
		}
	`
	expect(s instanceof CSSStyleSheet).toBe(true)
})

await test('css - sheet caches the same CSS string', expect => {
	const a = sheet('p { color: blue }')
	const b = sheet('p { color: blue }')

	expect(a).toBe(b)
})

await test('css - remove then re-add adopted stylesheet', expect => {
	const host = document.createElement('div')
	const root = host.attachShadow({ mode: 'open' })

	const s = css`
		b {
			color: green;
		}
	`

	addAdoptedStyleSheet(root, s)
	expect(getAdoptedStyleSheets(root).length).toBe(1)

	removeAdoptedStyleSheet(root, s)
	expect(getAdoptedStyleSheets(root).length).toBe(0)

	addAdoptedStyleSheet(root, s)
	expect(getAdoptedStyleSheets(root).length).toBe(1)
})
