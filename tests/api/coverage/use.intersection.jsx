/** @jsxImportSource pota */
// Coverage for pota/use/intersection: the `opts.once` branch in
// onVisible (lines 58-61) — auto-unsubscribe after the first
// `isIntersecting` entry, ignore exit entries, and ignore further
// entries once fired.

import { microtask, test } from '#test'

import { root } from 'pota'
import { onVisible } from 'pota/use/intersection'

/**
 * Replace the global `IntersectionObserver` with a controllable stub
 * for the duration of `fn`. The stub captures the dispatch callback
 * passed to each constructed observer so the test can feed crafted
 * entries on demand. `observe`/`disconnect` are recorded as no-ops
 * (the real observer never runs in headless tests, so we don't need
 * any layout). Restores the original in a finally block.
 *
 * @param {(api: {
 *   emit: (entry: object) => void
 *   disconnects: () => number
 * }) => Promise<void> | void} fn
 */
async function withObserver(fn) {
	const original = globalThis.IntersectionObserver
	/** @type {(arg: object) => void} */
	let dispatch
	let disconnects = 0

	class StubObserver {
		constructor(cb) {
			dispatch = cb
		}
		observe() {}
		disconnect() {
			disconnects++
		}
		unobserve() {}
		takeRecords() {
			return []
		}
	}

	globalThis.IntersectionObserver =
		/** @type {any} */ (StubObserver)

	try {
		await fn({
			emit: entry => dispatch([entry]),
			disconnects: () => disconnects,
		})
	} finally {
		globalThis.IntersectionObserver = original
	}
}

await test('intersection - onVisible once fires only on first isIntersecting entry', async expect => {
	// Fresh node per test: the module-level emitters weakStore keys on
	// the node, so a brand-new node guarantees a fresh observer.
	const node = document.createElement('div')

	await withObserver(async ({ emit }) => {
		const seen = []
		await root(async dispose => {
			onVisible(node, entry => seen.push(entry), { once: true })

			// The Emitter wires the subscription through an effect that
			// reads the signal; let it settle before emitting.
			await microtask()

			// Exit entry (isIntersecting false) — hits line 59 `!entry`
			// branch and must be ignored.
			emit({ isIntersecting: false, target: node })
			await microtask()
			expect(seen.length).toBe(0)

			// First real intersection — sets `fired = true` (lines
			// 60-61) and invokes the callback.
			emit({ isIntersecting: true, target: node })
			await microtask()
			expect(seen.length).toBe(1)
			expect(seen[0].isIntersecting).toBe(true)

			// A second intersecting entry — hits line 59 `fired`
			// branch and must be ignored (already fired).
			emit({ isIntersecting: true, target: node })
			await microtask()
			expect(seen.length).toBe(1)

			dispose()
		})
	})
})

await test('intersection - onVisible without once fires on every entry', async expect => {
	// Sanity counterpart: with no `once`, the line 58 branch is false,
	// so both intersecting and non-intersecting entries reach fn.
	const node = document.createElement('div')

	await withObserver(async ({ emit }) => {
		const seen = []
		await root(async dispose => {
			onVisible(node, entry => seen.push(entry))

			await microtask()

			emit({ isIntersecting: false, target: node })
			await microtask()
			emit({ isIntersecting: true, target: node })
			await microtask()

			expect(seen.length).toBe(2)
			expect(seen[0].isIntersecting).toBe(false)
			expect(seen[1].isIntersecting).toBe(true)

			dispose()
		})
	})
})
