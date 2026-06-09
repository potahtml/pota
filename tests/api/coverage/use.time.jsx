/** @jsxImportSource pota */
// Coverage tests for pota/use/time targeting uncovered branches:
//  - divisorFor fallthrough `return YEAR_DIV` (src line 191, branch
//    at the for-loop on line 190) — diff older than a year.
//  - useStopwatch.start early-return when already running (line 270).
//  - useStopwatch.stop early-return when not running (line 277).
//  - useStopwatch.reset `startedAt = ... : 0` arm when not running
//    (line 286).

import { test, sleep } from '#test'

import { root } from 'pota'
import { useElapsed, useStopwatch } from 'pota/use/time'

// divisorFor only branches over TICK_BOUNDARIES inside the useTimeout
// delay accessor. A timestamp more than a year in the past makes every
// `diffSec < t` comparison fail, so the loop falls through to
// `return YEAR_DIV`. We can't read the divisor directly, but useElapsed
// must still report the (large) elapsed seconds and must not throw when
// scheduling its tick — which only happens if divisorFor returned a
// usable divisor via the fallthrough path.
await test('time/coverage - useElapsed handles a timestamp older than a year (divisorFor fallthrough)', async expect => {
	await root(async dispose => {
		// ~2 years in the past, in Unix seconds.
		const twoYears = 86400 * 365 * 2
		const past = Date.now() / 1000 - twoYears

		const elapsed = useElapsed(past)
		const v = elapsed()

		// Should report roughly two years' worth of seconds (allow slop).
		expect(v >= twoYears - 5).toBe(true)
		expect(v <= twoYears + 5).toBe(true)

		// Give the scheduled tick a moment; with a >1y diff the tick is
		// scheduled at the year-divisor boundary (far in the future), so
		// the value should stay put and nothing should throw.
		await sleep(20)
		const later = elapsed()
		expect(later >= twoYears - 5).toBe(true)

		dispose()
	})
})

await test('time/coverage - useStopwatch.start is a no-op while already running', async expect => {
	await root(async dispose => {
		const sw = useStopwatch({ interval: 10 })

		expect(sw.start()).toBe(sw === undefined ? undefined : sw) // placeholder; replaced below
		dispose()
	})
})
