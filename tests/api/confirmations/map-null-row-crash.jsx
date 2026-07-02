/** @jsxImportSource pota */
// BUG CONFIRMATION — documentation/improvements.md: "Rows that render
// no DOM node crash removal and reorder". A callback returning null
// gives Row.nodes = null; begin()/end() stay null and nodesForRow()
// returns [null], so node.remove() throws on row disposal. Asserts
// the CURRENT buggy behavior (the error is routed to the boundary).

import { test, body } from '#test'
import { signal, map, effect, root, catchError, render } from 'pota'
import { For, Errored } from 'pota/components'

await test('CONFIRM - map() row rendering null throws on removal', expect => {
	const items = signal(['a', 'ghost', 'b'])
	const caught = []

	const dispose = /** @type {() => void} */ (
		catchError(
			() =>
				root(d => {
					const mapper = map(items.read, item =>
						item === 'ghost' ? null : <p>{item}</p>,
					)
					effect(() => mapper())
					return d
				}),
			err => caught.push(err instanceof Error ? err.message : String(err)),
		)
	)

	expect(caught).toEqual([])

	// removing the null row disposes it: Row.remove() walks
	// nodesForRow() = [null] and calls null.remove()
	items.write(['a', 'b'])

	// BUG: the reconciliation crashed instead of dropping the row
	expect(caught.length).toBe(1)
	expect(caught[0]).toInclude('remove')
	// FIXED: expect(caught).toEqual([])

	dispose()
})

await test('CONFIRM - <For> with a null row crashes when the row leaves', expect => {
	const items = signal(['a', 'ghost', 'b'])
	const errors = []

	const dispose = render(
		<Errored
			fallback={err => {
				errors.push(err instanceof Error ? err.message : String(err))
				return null
			}}
		>
			<For each={items.read}>
				{item => (item === 'ghost' ? null : <p>{item}</p>)}
			</For>
		</Errored>,
	)

	// the null row renders nothing but the list works
	expect(body()).toBe('<p>a</p><p>b</p>')

	// BUG: removing the null row blows up the whole list — the error
	// boundary triggers instead of the list updating
	items.write(['a', 'b'])
	expect(errors.length).toBe(1)
	expect(errors[0]).toInclude('remove')
	// FIXED: expect(errors).toEqual([]) and body() stays '<p>a</p><p>b</p>'

	dispose()
	expect(body()).toBe('')
})
