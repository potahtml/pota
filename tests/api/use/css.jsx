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

// --- adding the same stylesheet twice is de-duplicated ----------------

await test('css - adding the same stylesheet twice leaves one entry', expect => {
	const host = document.createElement('div')
	const root = host.attachShadow({ mode: 'open' })

	const s = css`
		em {
			color: purple;
		}
	`

	addAdoptedStyleSheet(root, s)
	addAdoptedStyleSheet(root, s)

	expect(getAdoptedStyleSheets(root).length).toBe(1)
})

// --- removing a stylesheet that was never added is a no-op ------------

await test('css - removing a non-adopted stylesheet is a no-op', expect => {
	const host = document.createElement('div')
	const root = host.attachShadow({ mode: 'open' })

	const s = css`
		strong {
			color: tomato;
		}
	`

	expect(getAdoptedStyleSheets(root).length).toBe(0)
	expect(() => removeAdoptedStyleSheet(root, s)).not.toThrow()
	expect(getAdoptedStyleSheets(root).length).toBe(0)
})

// --- multiple independent stylesheets --------------------------------

await test('css - multiple stylesheets coexist on the same shadow root', expect => {
	const host = document.createElement('div')
	const root = host.attachShadow({ mode: 'open' })

	const a = css`
		a {
			color: red;
		}
	`
	const b = css`
		b {
			color: blue;
		}
	`
	const c = css`
		i {
			color: green;
		}
	`

	addAdoptedStyleSheet(root, a)
	addAdoptedStyleSheet(root, b)
	addAdoptedStyleSheet(root, c)

	expect(getAdoptedStyleSheets(root).length).toBe(3)
})

// --- getAdoptedStyleSheets returns an array --------------------------

await test('css - getAdoptedStyleSheets returns an array-like', expect => {
	const host = document.createElement('div')
	const root = host.attachShadow({ mode: 'open' })

	const result = getAdoptedStyleSheets(root)
	expect(Array.isArray(result) || typeof result.length === 'number').toBe(
		true,
	)
})
