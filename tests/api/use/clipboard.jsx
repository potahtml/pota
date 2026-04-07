/** @jsxImportSource pota */

import { test } from '#test'

import { render } from 'pota'
import 'pota/use/clipboard'

await test('clipboard - use:clipboard copies explicit string values', expect => {
	const writes = []
	const original = navigator.clipboard

	Object.defineProperty(navigator, 'clipboard', {
		configurable: true,
		value: {
			writeText(text) {
				writes.push(text)
				return Promise.resolve()
			},
		},
	})

	const dispose = render(
		<button use:clipboard="copied value">Copy</button>,
	)

	document.querySelector('button').click()

	expect(writes).toEqual(['copied value'])

	dispose()
	Object.defineProperty(navigator, 'clipboard', {
		configurable: true,
		value: original,
	})
})

await test('clipboard - use:clipboard can read text from the node or a callback', expect => {
	const writes = []
	const original = navigator.clipboard

	Object.defineProperty(navigator, 'clipboard', {
		configurable: true,
		value: {
			writeText(text) {
				writes.push(text)
				return Promise.resolve()
			},
		},
	})

	const dispose = render(
		<>
			<button use:clipboard={true}> Inner Value </button>
			<button
				id="callback-copy"
				use:clipboard={event => event.type + '-value'}
			>
				ignored
			</button>
		</>,
	)

	const [first, second] = document.querySelectorAll('button')
	first.click()
	second.click()

	expect(writes).toEqual(['Inner Value', 'click-value'])

	dispose()
	Object.defineProperty(navigator, 'clipboard', {
		configurable: true,
		value: original,
	})
})
