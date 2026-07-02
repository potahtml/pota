// REGRESSION — documentation/improvements.md: "Memo discards a
// successful recompute after an error". After update() throws, the
// error path stamps `updatedAt = time + 1` to suppress re-runs for
// the rest of the flush; that stamp used to also discard a
// now-successful same-tick recompute, leaving the memo CLEAN with
// the stale value. Fixed with the `errored` flag: a successful
// recompute after an error always commits (diverges from Solid 1.x).

import { test } from '#test'
import { signal, memo, catchError, root } from 'pota'

await test('successful re-run after a throw commits immediately', expect => {
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

	// this read re-runs fn (STALE); fn now succeeds and the fresh
	// value commits instead of being discarded
	expect(m()).toBe(20)
	expect(runs).toBe(3)

	// committed and CLEAN: further reads don't recompute
	expect(m()).toBe(20)
	expect(runs).toBe(3)

	// source writes keep working
	s.write(3)
	expect(m()).toBe(30)
	expect(runs).toBe(4)

	r.dispose()
})
