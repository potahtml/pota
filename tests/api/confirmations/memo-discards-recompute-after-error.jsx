// BUG CONFIRMATION — documentation/improvements.md: "Memo discards a
// successful recompute after an error". After update() throws,
// `updatedAt = time + 1`; a read in the same tick re-runs fn, and a
// now-successful result is discarded by the `updatedAt <= time`
// guard — the memo ends CLEAN holding the stale value until some
// source fires again. Inherited Solid quirk; confirm intent.

import { test } from '#test'
import { signal, memo, catchError, root } from 'pota'

await test('CONFIRM - successful re-run after a throw is discarded until next write', expect => {
	const s = signal(1)
	const caught = []
	let throwOnce = false
	let runs = 0

	const r = root(dispose => ({
		m: /** @type {() => number} */ (
			catchError(
				() =>
					memo(() => {
						runs++
						const v = s.read()
						if (throwOnce) {
							throwOnce = false
							throw new Error('once')
						}
						return v * 10
					}),
				err =>
					caught.push(err instanceof Error ? err.message : String(err)),
			)
		),
		dispose,
	}))
	const m = r.m

	expect(m()).toBe(10)
	expect(runs).toBe(1)

	// make the next recompute throw
	throwOnce = true
	s.write(2)
	expect(caught).toEqual(['once'])
	expect(runs).toBe(2)

	// this read re-runs fn (STALE), fn now succeeds and computes 20…
	// BUG: …but the result is discarded (updatedAt = time + 1 guard)
	// and the memo is left CLEAN with the stale value
	expect(m()).toBe(10)
	// FIXED: expect(m()).toBe(20)
	expect(runs).toBe(3)

	// CLEAN with stale value: further reads don't even recompute
	expect(m()).toBe(10)
	expect(runs).toBe(3)

	// only a new source write recovers it
	s.write(3)
	expect(m()).toBe(30)
	expect(runs).toBe(4)

	r.dispose()
})
