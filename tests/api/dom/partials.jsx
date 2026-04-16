/** @jsxImportSource pota */

// Tests for `createPartial()` from `pota/jsx-runtime` — element
// factory used by the JSX transform; supports namespace overrides
// and prop injection.

import { $, body, test } from '#test'
import { render } from 'pota'
import { createPartial } from 'pota/jsx-runtime'

// --- SVG partial via createPartial -------------------------------------------

await test('createPartial - createPartial creates SVG elements with correct namespace', expect => {
	const svgNs = 'http://www.w3.org/2000/svg'
	const partial = createPartial('<circle cx="50" cy="50" r="40"/>', {
		x: svgNs,
	})

	const dispose = render(
		<svg>{partial()}</svg>,
	)

	const circle = $('circle')
	expect(circle).not.toBe(null)
	expect(circle.namespaceURI).toBe(svgNs)

	dispose()
})

await test('createPartial - createPartial creates MathML elements with correct namespace', expect => {
	const mathNs = 'http://www.w3.org/1998/Math/MathML'
	const partial = createPartial('<mi>x</mi><mo>+</mo><mn>1</mn>', {
		x: mathNs,
	})

	const dispose = render(
		<math>{partial()}</math>,
	)

	const mi = $('mi')
	expect(mi).not.toBe(null)
	expect(mi.namespaceURI).toBe(mathNs)

	dispose()
})

// --- createPartial without namespace (HTML) ----------------------------------

await test('createPartial - createPartial creates HTML elements by default', expect => {
	const partial = createPartial('<p>hello</p><span>world</span>')

	const dispose = render(partial())

	expect(body()).toBe('<p>hello</p><span>world</span>')

	dispose()
})

// --- createPartial with props ------------------------------------------------

await test('createPartial - createPartial passes props to child nodes', expect => {
	const partial = createPartial('<p></p>', {
		m: 1,
	})

	const dispose = render(
		partial([
			node => {
				node.textContent = 'injected'
			},
		]),
	)

	expect($('p').textContent).toBe('injected')

	dispose()
})
