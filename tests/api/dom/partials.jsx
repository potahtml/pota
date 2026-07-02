/** @jsxImportSource pota */

// Tests for `createPartial()` from `pota/jsx-runtime` — element
// factory used by the JSX transform; supports namespace overrides
// and prop injection.

import { $, body, test } from '#test'
import { render, signal } from 'pota'
import { createPartial } from 'pota/jsx-runtime'

// --- SVG partial via createPartial -------------------------------------------

await test('createPartial - createPartial creates SVG elements with correct namespace', expect => {
	const svgNs = 'http://www.w3.org/2000/svg'
	const partial = createPartial('<circle cx="50" cy="50" r="40"/>', {
		x: svgNs,
	})

	const dispose = render(<svg>{partial()}</svg>)

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

	const dispose = render(<math>{partial()}</math>)

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

await test('createPartial - createPartial passes the cloned root to the assign function', expect => {
	const partial = createPartial('<p></p>')

	const dispose = render(
		partial(node => {
			node.textContent = 'injected'
		}),
	)

	expect($('p').textContent).toBe('injected')

	dispose()
})

await test('createPartial - assign receives the fragment for multi-node content', expect => {
	const partial = createPartial('<p>a</p><span>b</span>')

	const dispose = render(
		partial(node => {
			node.firstChild.textContent = 'first'
			node.firstChild.nextSibling.textContent = 'second'
		}),
	)

	expect(body()).toBe('<p>first</p><span>second</span>')

	dispose()
})

// --- compiled walk: node paths inlined by the babel preset --------------------

await test('createPartial - compiled walk targets siblings after static content', expect => {
	const p = signal('p')
	const footer = signal('footer')

	const dispose = render(
		<div>
			<h1>title</h1>
			<p title={p.read}>text</p>
			<footer title={footer.read}>ok</footer>
		</div>,
	)

	expect($('p').getAttribute('title')).toBe('p')
	expect($('footer').getAttribute('title')).toBe('footer')

	footer.write('updated')
	expect($('footer').getAttribute('title')).toBe('updated')

	dispose()
})

await test('createPartial - compiled walk in fragment with leading text', expect => {
	const a = signal('left')
	const b = signal('right')

	const dispose = render(
		<>
			text <span title={a.read}>a</span>
			<b title={b.read}>x</b>
		</>,
	)

	expect(body()).toBe(
		'text <span title="left">a</span><b title="right">x</b>',
	)

	dispose()
})

await test('createPartial - compiled walk survives newline stripping after pre', expect => {
	const title = signal('code')

	const dispose = render(
		<pre>
			{'\n'}
			<code title={title.read}>x</code>
		</pre>,
	)

	// the newline after `<pre>` is dropped by the parser, so `<code>`
	// is the first child — the compiled path must account for it
	expect($('code').getAttribute('title')).toBe('code')

	dispose()
})

await test('createPartial - compiled walk enters nested template content', expect => {
	const inside = signal('inside')
	const after = signal('after')

	const dispose = render(
		<div>
			<template>
				<b title={inside.read}>x</b>
			</template>
			<i title={after.read}>y</i>
		</div>,
	)

	// a `<template>`'s children live under `.content` in the cloned
	// tree, and the path to `<i>` must not count them as siblings
	expect(
		$('template').content.firstElementChild.getAttribute('title'),
	).toBe('inside')
	expect($('i').getAttribute('title')).toBe('after')

	dispose()
})

await test('createPartial - compiled walk reaches nested svg elements', expect => {
	const r = signal('40')

	const dispose = render(
		<svg>
			<circle cx="50" cy="50" r={r.read} />
		</svg>,
	)

	const circle = $('circle')
	expect(circle.namespaceURI).toBe('http://www.w3.org/2000/svg')
	expect(circle.getAttribute('r')).toBe('40')

	dispose()
})
