/** @jsxImportSource pota */

import { test } from '#test'

import { render } from 'pota'
import { getSelection, restoreSelection } from 'pota/use/selection'
import 'pota/use/selection'

await test('selection - getSelection and restoreSelection round-trip a range', expect => {
	const node = document.createElement('div')
	node.textContent = 'hello'
	document.body.appendChild(node)

	const range = document.createRange()
	range.selectNodeContents(node.firstChild)
	window.getSelection().removeAllRanges()
	window.getSelection().addRange(range)

	const saved = getSelection()
	window.getSelection().removeAllRanges()
	restoreSelection(saved)

	expect(getSelection().toString()).toBe('hello')
	restoreSelection(null)

	node.remove()
	window.getSelection().removeAllRanges()
})

await test('selection - use:click-selects-all selects the node contents', expect => {
	const dispose = render(
		<div use:click-selects-all={true}>selected text</div>,
	)

	document.querySelector('div').click()

	expect(window.getSelection().toString()).toBe('selected text')

	window.getSelection().removeAllRanges()
	dispose()
})
