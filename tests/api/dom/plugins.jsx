/** @jsxImportSource pota */

// Tests for `propsPlugin()` and `propsPluginNS()` — registering
// custom prop handlers (immediate and deferred).

import { $, body, microtask, test } from '#test'
import {
	cleanup,
	propsPlugin,
	propsPluginNS,
	render,
	signal,
	withValue,
} from 'pota'

await test('propsPlugin and propsPluginNS - handle immediate and deferred plugins', async expect => {
	propsPlugin(
		'data-now',
		(node, value) => node.setAttribute('data-now-ran', value),
		false,
	)
	propsPluginNS(
		'qa',
		(node, localName, value) =>
			node.setAttribute(`data-${localName}`, value),
		false,
	)
	propsPluginNS(
		'inspect',
		(node, localName, value) =>
			node.setAttribute(`data-inspect-${localName}`, value),
		false,
	)
	propsPlugin('data-later', (node, value) =>
		node.setAttribute('data-later-ran', value),
	)

	const dispose = render(
		<div
			data-now="yes"
			data-later="soon"
			qa:test="ok"
			inspect:id="42"
		>
			hello
		</div>,
	)

	expect(body()).toBe(
		'<div data-now="yes" data-later="soon" data-test="ok" data-inspect-id="42">hello</div>',
	)

	dispose()
})

// --- propsPluginNS with reactive signal value ---------------------------------

await test('propsPluginNS - reactive signal value updates the element', expect => {
	propsPluginNS(
		'test-ns',
		(node, localName, value) => {
			withValue(value, v => node.setAttribute(`data-${localName}`, v))
		},
		false,
	)

	const val = signal('initial')
	const dispose = render(<div test-ns:custom={val.read}>content</div>)

	expect($('div').getAttribute('data-custom')).toBe('initial')

	val.write('updated')
	expect($('div').getAttribute('data-custom')).toBe('updated')

	dispose()
})

// --- default onMicrotask=true defers the handler ---------------------
//
// NOTE: non-namespaced `propsPlugin` dispatch only runs for props
// that reach `assignProp` at runtime — i.e. JSX spreads. Static or
// dynamic literal attributes on a JSX tag are compiled by the Babel
// preset directly to `setAttribute`/HTML template and bypass the
// plugin map. Use a spread to force the dispatch.

await test('propsPlugin - default (onMicrotask=true) runs after a microtask', async expect => {
	let ran = 0
	propsPlugin('data-deferred-default', (node, value) => {
		ran++
		node.setAttribute('data-deferred-ran', String(value))
	})

	const props = { 'data-deferred-default': 'yes' }
	const dispose = render(<div {...props} />)

	// The handler is scheduled via `onProps` (scheduler priority 1),
	// so it has NOT run synchronously yet.
	expect(ran).toBe(0)
	expect($('div').getAttribute('data-deferred-ran')).toBe(null)

	await microtask()

	expect(ran).toBe(1)
	expect($('div').getAttribute('data-deferred-ran')).toBe('yes')

	dispose()
})

// --- deferred plugin still unwraps a reactive value ------------------

await test('propsPlugin - deferred plugin receives reactive values via withValue', async expect => {
	propsPlugin('data-deferred-reactive', (node, value) => {
		withValue(value, v =>
			node.setAttribute('data-deferred-reactive-ran', String(v)),
		)
	})

	const val = signal('first')
	const props = { 'data-deferred-reactive': val.read }
	const dispose = render(<div {...props} />)

	await microtask()

	expect($('div').getAttribute('data-deferred-reactive-ran')).toBe(
		'first',
	)

	val.write('second')
	expect($('div').getAttribute('data-deferred-reactive-ran')).toBe(
		'second',
	)

	dispose()
})

// --- plugin that registers a cleanup --------------------------------

await test('propsPlugin - handler-registered cleanup fires on disposal', expect => {
	let cleanedCount = 0
	propsPlugin(
		'data-with-cleanup',
		(node, value) => {
			node.setAttribute('data-cleanup-set', String(value))
			cleanup(() => {
				cleanedCount++
				node.removeAttribute('data-cleanup-set')
			})
		},
		false, // synchronous so cleanup registers against the render owner
	)

	const props = { 'data-with-cleanup': 'active' }
	const dispose = render(<div {...props} />)
	expect($('div').getAttribute('data-cleanup-set')).toBe('active')

	dispose()

	// The render owner disposed → the plugin's cleanup ran exactly once.
	expect(cleanedCount).toBe(1)
})
