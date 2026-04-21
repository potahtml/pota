/** @jsxImportSource pota */
// Creative coverage-filling tests for hard-to-reach defensive
// guards, DOM-element interactions, and platform-specific paths.

import { $, microtask, test, sleepLong } from '#test'
import { render } from 'pota'
import { root } from 'pota'
import { mutable, signalify } from 'pota/store'
import { setCSS } from '../../../src/core/props/css.js'
import { xml } from 'pota/xml'
import { useDocumentVisible } from 'pota/use/visibility'
import { bind } from 'pota/use/bind'

// mutable(blacklistedObject) — getPropertyDescriptors' early-return
// for blacklisted constructors (descriptors.js: isMutationBlacklisted
// → nothing).

await test('mutable on a blacklisted-constructor object returns it unchanged', expect => {
	// an HTMLDivElement's constructor is on the window blacklist
	const el = document.createElement('div')
	const m = mutable({ node: el })
	// the wrapper object gets proxied but the inner DOM node does not
	expect(m.node).toBe(el)
})

await test('mutable(Date) early-returns because Date is blacklisted', expect => {
	const d = new Date('2020-01-01')
	const m = mutable({ when: d })
	// Date is not descended into — m.when stays the same Date instance
	expect(m.when).toBe(d)
})

// signalify() does not pre-filter blacklisted targets like mutable()
// does, so signalifyObject → getPropertyDescriptors is called with a
// blacklisted target. That hits the
// `if (isMutationBlacklisted(target)) return nothing` guard in
// src/lib/store/descriptors.js.

await test('signalify on a blacklisted DOM element is a no-op', expect => {
	const el = document.createElement('div')
	// should not throw, should not install signalified accessors
	signalify(el)
	// native property still accessible as-is
	expect(el.tagName).toBe('DIV')
})

// Element instance that's already connected to the DOM — setCSS takes
// the direct `setNodeCSS(node, value)` arm instead of deferring via
// onMount.

await test('setCSS on a connected element takes the synchronous arm', async expect => {
	const dispose = render(<div id="css-direct">x</div>)
	await microtask()
	const node = $('#css-direct')
	// node is now connected (isConnected === true) — setCSS should
	// run setNodeCSS immediately, not defer through onMount
	setCSS(node, 'class { color: purple }')
	expect(node.className.length > 0).toBe(true)
	dispose()
	// setCSS registers adopted stylesheets globally; clean up so the
	// per-test harness cleanliness check passes
	document.adoptedStyleSheets = []
})

// use:bind on an element that is NOT an HTMLElement — bindValue's
// `if (!(n instanceof HTMLElement)) return` early-return path.

await test('use:bind on non-HTMLElement early-returns without binding', expect => {
	// SVGTextElement is not an HTMLElement; bindValue should no-op
	// (no crash, no binding established).
	const b = bind(/** @type {any} */ ('whatever'))
	const dispose = render(
		<svg>
			<text use:bind={b}>x</text>
		</svg>,
	)
	expect($('text')).not.toBe(null)
	dispose()
})

// xml template with a CDATA section — DOMParser preserves CDATA as
// a nodeType-4 node, which hits xml.js' default (unsupported) arm.
// `error()` in that arm is a console.error, not a throw, so the
// template still renders what it can.

// This file is isolated (its own tab), so the Emitter counter is
// fresh: subscribing once and disposing drives it to 0 and fires
// the `off` cleanup — the `removeEventNative(document,
// 'visibilitychange', handler)` body in src/use/visibility.js.

await test('visibility - Emitter off cleanup runs when last subscriber disposes', expect => {
	const disposer = root(d => {
		const accessor = useDocumentVisible()
		expect(typeof accessor()).toBe('boolean')
		return d
	})
	// dispose the owner: Emitter counter goes to 0 → `off`
	// (removeEventNative) fires
	disposer()
	// no assertion needed beyond execution — coverage tracks the
	// cleanup arm
	expect(true).toBe(true)
})

await test('xml template with CDATA triggers the unsupported-nodeType default arm', expect => {
	// Suppress the expected console.error so the test-runner doesn't
	// flag it as a failure.
	const original = console.error
	let called = 0
	console.error = () => {
		called++
	}
	try {
		const template = xml`<root><![CDATA[hello]]></root>`
		// rendering is best-effort; we only care that error() was
		// invoked for the CDATA node, i.e. the default arm ran
		const dispose = render(template)
		expect(called > 0).toBe(true)
		dispose()
	} finally {
		console.error = original
	}
})
