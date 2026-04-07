/** @jsxImportSource pota */

import { test } from '#test'

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
	await new Promise(resolve => setTimeout(resolve, 0))

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

	await new Promise(resolve => setTimeout(resolve, 0))
	await new Promise(resolve => setTimeout(resolve, 0))

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

	await new Promise(resolve => setTimeout(resolve, 0))
	await new Promise(resolve => setTimeout(resolve, 0))
	await new Promise(resolve => setTimeout(resolve, 0))

	expect(calls).toBe(1)
	expect(getAdoptedStyleSheets(rootA)[0]).toBe(
		getAdoptedStyleSheets(rootB)[0],
	)

	globalThis.fetch = originalFetch
})
