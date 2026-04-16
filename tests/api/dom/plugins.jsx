/** @jsxImportSource pota */

// Tests for `propsPlugin()` and `propsPluginNS()` — registering
// custom prop handlers (immediate and deferred).

import { $, body, test } from '#test'
import {
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
			withValue(value, v =>
				node.setAttribute(`data-${localName}`, v),
			)
		},
		false,
	)

	const val = signal('initial')
	const dispose = render(
		<div test-ns:custom={val.read}>content</div>,
	)

	expect($('div').getAttribute('data-custom')).toBe('initial')

	val.write('updated')
	expect($('div').getAttribute('data-custom')).toBe('updated')

	dispose()
})
