/** @jsxImportSource pota */
// REGRESSION — documentation/improvements.md: "`toDiff` fast-clear
// breaks on falsy prev slots". The short/fast-clear branch assumed
// every `prev` slot was a node: a leading falsy slot (null/undefined
// child) made the parent lookup falsy and the branch returned as if
// the parent left the document — skipping removal entirely; and
// falsy slots counted towards the whole-content heuristic, so the
// `textContent = ''` wipe could destroy sibling nodes that were
// never part of the reactive child. Fixed: the branch scans for the
// first real node and counts only real nodes.

import { test, $ } from '#test'
import { render, signal } from 'pota'

await test('clearing a reactive array with a leading falsy item removes the later nodes', expect => {
	const items = signal([null, <b>c</b>, undefined])

	const dispose = render(<div>{() => items.read()}</div>)

	expect($('div').innerHTML).toBe('<b>c</b>')

	items.write([])
	expect($('div').innerHTML).toBe('')

	dispose()
})

await test('a mid-array falsy item does not make the fast clear wipe innocent siblings', expect => {
	const items = signal([<b>a</b>, undefined, <i>b</i>])

	const dispose = render(
		<div>
			<span>static</span>
			{() => items.read()}
		</div>,
	)

	expect($('div').innerHTML).toBe(
		'<span>static</span><b>a</b><i>b</i>',
	)

	items.write([])
	expect($('div').innerHTML).toBe('<span>static</span>')

	dispose()
})

await test('control - clearing works when the first item is a real node', expect => {
	const items = signal([<b>c</b>, null, undefined])

	const dispose = render(<div>{() => items.read()}</div>)

	expect($('div').innerHTML).toBe('<b>c</b>')

	items.write([])
	expect($('div').innerHTML).toBe('')

	dispose()
})
