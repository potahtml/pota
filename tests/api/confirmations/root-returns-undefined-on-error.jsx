// BUG CONFIRMATION — documentation/improvements.md: "`root()` /
// `render()` return `undefined` on setup error". `runWithOwner`
// catches and routes the error, so `render()`'s dispose can be
// `undefined` — `cleanup(undefined)` is registered and parent
// disposal later routes a TypeError from calling it. Asserts the
// CURRENT buggy behavior.

import { test, body } from '#test'
import { root, render, catchError } from 'pota'

await test('CONFIRM - root() returns undefined when its function throws', expect => {
	const caught = []
	/** @type {unknown} */ let result = 'sentinel'

	catchError(
		() => {
			result = root(() => {
				throw new Error('setup')
			})
		},
		err => caught.push(err instanceof Error ? err.message : String(err)),
	)

	expect(caught).toEqual(['setup'])

	// BUG: the caller can't distinguish failure from a root that
	// legitimately returns undefined
	expect(result).toBe(undefined)

	// nothing rendered
	expect(body()).toBe('')
})

await test('CONFIRM - render() setup throw registers an undefined disposer', expect => {
	const caught = []
	/** @type {unknown} */ let d = 'sentinel'

	const outerDispose = /** @type {() => void} */ (
		catchError(
			() =>
				root(dispose => {
					d = render(() => {
						throw new Error('render-setup')
					})
					return dispose
				}),
			err => caught.push(err instanceof Error ? err.message : String(err)),
		)
	)

	expect(caught).toEqual(['render-setup'])

	// BUG: render() returned undefined instead of a disposer
	expect(d).toBe(undefined)

	// BUG: cleanup(undefined) was registered on the parent — parent
	// disposal routes a TypeError from trying to call it
	outerDispose()
	expect(caught.length).toBe(2)
	expect(caught[1]).toInclude('is not a function')

	expect(body()).toBe('')
})
