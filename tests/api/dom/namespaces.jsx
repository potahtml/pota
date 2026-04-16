/** @jsxImportSource pota */

// Tests for namespace handling — SVG, MathML, foreignObject,
// xlink:href / href on <use>.

import { $, test } from '#test'
import { render } from 'pota'

await test('namespaces - SVG elements render with correct namespace', expect => {
	const dispose = render(
		<svg width="100" height="100">
			<circle cx="50" cy="50" r="40" />
		</svg>,
	)

	const svg = $('svg')
	expect(svg instanceof SVGElement).toBe(true)
	expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg')

	const circle = $('circle')
	expect(circle instanceof SVGElement).toBe(true)
	expect(circle.namespaceURI).toBe('http://www.w3.org/2000/svg')

	dispose()
})

await test('namespaces - nested SVG elements preserve SVG namespace', expect => {
	const dispose = render(
		<svg>
			<g>
				<rect width="10" height="10" />
			</g>
		</svg>,
	)

	const rect = $('rect')
	expect(rect.namespaceURI).toBe('http://www.w3.org/2000/svg')

	dispose()
})

// --- foreignObject resets namespace to HTML -----------------------------------

await test('namespaces - foreignObject inside SVG allows HTML children', expect => {
	const dispose = render(
		<svg>
			<foreignObject>
				<div>html inside svg</div>
			</foreignObject>
		</svg>,
	)

	const div = $('div')
	expect(div instanceof HTMLDivElement).toBe(true)

	dispose()
})

// --- MathML namespace --------------------------------------------------------

await test('namespaces - MathML elements render with correct namespace', expect => {
	const dispose = render(
		<math>
			<mrow>
				<mi>x</mi>
			</mrow>
		</math>,
	)

	const math = $('math')
	expect(math.namespaceURI).toBe('http://www.w3.org/1998/Math/MathML')

	const mi = $('mi')
	expect(mi.namespaceURI).toBe('http://www.w3.org/1998/Math/MathML')

	dispose()
})

// --- reactive attribute with xlink namespace ---------------------------------

await test('namespaces - SVG xlink:href attribute renders correctly', expect => {
	const dispose = render(
		<svg>
			<use href="#icon" />
		</svg>,
	)

	const use = $('use')
	expect(use).not.toBe(null)
	expect(use.getAttribute('href')).toBe('#icon')

	dispose()
})
