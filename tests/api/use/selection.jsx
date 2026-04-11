/** @jsxImportSource pota */
// Tests for pota/use/selection: getSelection/restoreSelection
// round-trip, use:click-selects-all, and null/undefined edge cases.

import { microtask, test, $ } from '#test'

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

await test('selection - use:click-selects-all selects the node contents', async expect => {
	const dispose = render(
		<div use:click-selects-all={true}>selected text</div>,
	)

	await microtask()

	$('div').click()

	expect(window.getSelection().toString()).toBe('selected text')

	window.getSelection().removeAllRanges()
	dispose()
})

await test('selection - getSelection returns null when nothing is selected', expect => {
	window.getSelection().removeAllRanges()
	const result = getSelection()
	expect(result).toBe(null)
})

await test('selection - restoreSelection is a no-op for undefined', expect => {
	// should not throw
	restoreSelection(undefined)
	restoreSelection(null)
})

// --- restoreSelection round-trip through restore ------------------------

await test('selection - restoreSelection handles a previously saved range twice in a row', expect => {
	const node = document.createElement('div')
	node.textContent = 'double'
	document.body.appendChild(node)

	const range = document.createRange()
	range.selectNodeContents(node.firstChild)
	window.getSelection().removeAllRanges()
	window.getSelection().addRange(range)

	const saved = getSelection()

	window.getSelection().removeAllRanges()
	restoreSelection(saved)
	expect(getSelection().toString()).toBe('double')

	window.getSelection().removeAllRanges()
	restoreSelection(saved)
	expect(getSelection().toString()).toBe('double')

	node.remove()
	window.getSelection().removeAllRanges()
})

// --- use:click-selects-all on a disposed element does not throw --------

await test('selection - use:click-selects-all is cleaned up on dispose', async expect => {
	const dispose = render(
		<div use:click-selects-all={true}>selected</div>,
	)

	await microtask()

	dispose()

	// After dispose the element is gone; no errors expected
	window.getSelection().removeAllRanges()
	expect(getSelection()).toBe(null)
})
