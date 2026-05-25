/** @jsxImportSource pota */
// Tests for pota/use/time: date/time/datetime formatters, measure,
// timing, and useTimeout (start, stop, reactive delay).

import { microtask, test, sleep } from '#test'

import { root, signal } from 'pota'
import {
	date,
	day,
	datetime,
	measure,
	now,
	time,
	timeWithSeconds,
	timing,
	useElapsed,
	useStopwatch,
	useTimeout,
} from 'pota/use/time'

await test('time - date and time format timestamps consistently', expect => {
	const timestamp = new Date(2020, 0, 2, 3, 4, 5).getTime()

	expect(date(timestamp)).toBe('2020-01-02')
	expect(time(timestamp)).toBe('03:04')
	expect(timeWithSeconds(timestamp)).toBe('03:04:05')
	expect(datetime(timestamp)).toBe('2020-01-02 03:04')
	expect(day(timestamp, 'en')).toInclude('2020')
	expect(typeof now()).toBe('number')
})

await test('time - measure and timing report durations', expect => {
	const originalTime = console.time
	const originalTimeEnd = console.timeEnd
	const labels = []

	console.time = label => labels.push(['start', label])
	console.timeEnd = label => labels.push(['end', label])

	let reported = 0
	const result = measure(
		'job',
		() => 42,
		duration => {
			reported = duration
		},
	)
	const timed = timing(() => {})

	console.time = originalTime
	console.timeEnd = originalTimeEnd

	expect(result).toBe(42)
	expect(reported >= 0).toBe(true)
	expect(timed >= 0).toBe(true)
	expect(labels).toEqual([
		['start', 'job'],
		['end', 'job'],
	])
})

await test('time - useTimeout starts, stops and supports reactive delays', async expect => {
	const calls = []
	const delay = signal(5)

	await root(async () => {
		const timer = useTimeout(
			value => {
				calls.push(value)
			},
			delay.read,
			'first',
		)

		expect(timer.start()).toBe(timer)
		await sleep(20)
		expect(calls).toEqual(['first'])

		delay.write(Infinity)
		timer.start()
		await sleep(20)
		expect(calls).toEqual(['first'])

		delay.write(50)
		timer.start()
		timer.stop()
		await sleep(60)
		expect(calls).toEqual(['first'])
	})
})

await test('time - date formats midnight correctly', expect => {
	const midnight = new Date(2023, 5, 15, 0, 0, 0).getTime()
	expect(date(midnight)).toBe('2023-06-15')
	expect(time(midnight)).toBe('00:00')
	expect(timeWithSeconds(midnight)).toBe('00:00:00')
})

await test('time - date formats end of day correctly', expect => {
	const endOfDay = new Date(2023, 11, 31, 23, 59, 59).getTime()
	expect(time(endOfDay)).toBe('23:59')
	expect(timeWithSeconds(endOfDay)).toBe('23:59:59')
})

await test('time - date and time default to now when no timestamp provided', expect => {
	const d = date()
	const t = time()
	// just verify they return strings in the correct format
	expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/)
	expect(t).toMatch(/^\d{2}:\d{2}$/)
})

await test('time - useTimeout stop prevents pending callback', async expect => {
	const calls = []

	await root(async () => {
		const timer = useTimeout(() => calls.push('fired'), 10)

		timer.start()
		timer.stop()
		await sleep(20)

		expect(calls).toEqual([])
	})
})

await test('time - useTimeout start returns the timer for chaining', async expect => {
	await root(async () => {
		const timer = useTimeout(() => {}, 1000)
		const result = timer.start()
		expect(result).toBe(timer)
		timer.stop()
	})
})

// --- now() returns a numeric value that increases over time ---------

await test('time - now returns ascending values on successive calls', async expect => {
	const first = now()
	await sleep(5)
	const second = now()

	expect(second >= first).toBe(true)
})

// --- date formatter handles start of year ---------------------------

await test('time - date formats January 1st correctly', expect => {
	const ts = new Date(2020, 0, 1, 12, 0, 0).getTime()
	expect(date(ts)).toBe('2020-01-01')
})

// double-digit month and day skip the zero-padding ternary arms.

await test('time - date formats double-digit month and day without padding', expect => {
	const ts = new Date(2020, 10, 15, 12, 0, 0).getTime()
	expect(date(ts)).toBe('2020-11-15')
})

// --- useStopwatch ---------------------------------------------------

await test('time - useStopwatch starts at zero and counts while running', async expect => {
	await root(async dispose => {
		const sw = useStopwatch({ interval: 10 })

		expect(sw.elapsed()).toBe(0)
		expect(sw.running()).toBe(false)

		sw.start()
		expect(sw.running()).toBe(true)

		await sleep(40)
		expect(sw.elapsed() > 0).toBe(true)

		dispose()
	})
})

await test('time - useStopwatch stop pauses the counter at its current value', async expect => {
	await root(async dispose => {
		const sw = useStopwatch({ interval: 10 })
		sw.start()
		await sleep(30)
		sw.stop()

		expect(sw.running()).toBe(false)
		const paused = sw.elapsed()
		expect(paused > 0).toBe(true)

		await sleep(40)
		expect(sw.elapsed()).toBe(paused)

		dispose()
	})
})

await test('time - useStopwatch start resumes from the accumulated total', async expect => {
	await root(async dispose => {
		const sw = useStopwatch({ interval: 10 })
		sw.start()
		await sleep(30)
		sw.stop()
		const first = sw.elapsed()

		sw.start()
		await sleep(30)
		expect(sw.elapsed() > first).toBe(true)

		dispose()
	})
})

await test('time - useStopwatch reset zeros the counter', async expect => {
	await root(async dispose => {
		const sw = useStopwatch({ interval: 10, autoStart: true })
		await sleep(30)
		expect(sw.elapsed() > 0).toBe(true)

		sw.reset()
		expect(sw.elapsed()).toBe(0)

		dispose()
	})
})

await test('time - useStopwatch autoStart begins running immediately', async expect => {
	await root(dispose => {
		const sw = useStopwatch({ autoStart: true })
		expect(sw.running()).toBe(true)
		dispose()
	})
})

await test('time - useStopwatch stops ticking on scope dispose', async expect => {
	/** @type {ReturnType<typeof useStopwatch>} */
	let sw
	await root(d => {
		sw = useStopwatch({ interval: 10, autoStart: true })
		d()
	})

	const after = sw.elapsed()
	await sleep(40)
	// after dispose the underlying useTimeout is cleaned up; elapsed
	// is frozen.
	expect(sw.elapsed()).toBe(after)
})

// --- time formatter pads single-digit values ------------------------

await test('time - time formatter pads single-digit hours and minutes with zero', expect => {
	const ts = new Date(2020, 0, 1, 5, 3, 0).getTime()
	expect(time(ts)).toBe('05:03')
})

// --- useTimeout multiple starts restart the timer ------------------

await test('time - useTimeout start() is re-callable without stop', async expect => {
	const calls = []

	await root(async () => {
		const timer = useTimeout(() => calls.push('fired'), 5)

		timer.start()
		timer.start() // restart, should not double-fire

		await sleep(20)

		// Only one fire despite two starts
		expect(calls).toEqual(['fired'])
	})
})

// --- measure without the optional timeReport argument --------------

await test('time - measure works when no timeReport callback is provided', expect => {
	const originalTime = console.time
	const originalTimeEnd = console.timeEnd

	console.time = () => {}
	console.timeEnd = () => {}

	// 2-argument form: `timeReport` is undefined, so the
	// `timeReport && timeReport(...)` branch must not throw.
	const result = measure('job', () => 'computed')

	console.time = originalTime
	console.timeEnd = originalTimeEnd

	expect(result).toBe('computed')
})

// --- useElapsed ----------------------------------------------------

await test('time - useElapsed reports seconds elapsed since timestamp', async expect => {
	await root(async dispose => {
		// 5 seconds in the past
		const past = (Date.now() - 5000) / 1000
		const elapsed = useElapsed(past)
		// allow ±1s slop for scheduler timing
		const v = elapsed()
		expect(v >= 4 && v <= 7).toBe(true)
		dispose()
	})
})

await test('time - useElapsed returns 0 for falsy timestamp', async expect => {
	await root(async dispose => {
		expect(useElapsed(0)()).toBe(0)
		expect(useElapsed(null)()).toBe(0)
		expect(useElapsed(undefined)()).toBe(0)
		dispose()
	})
})

await test('time - useElapsed accepts an accessor and reacts to it', async expect => {
	await root(async dispose => {
		const t = signal(0)
		const elapsed = useElapsed(t.read)
		expect(elapsed()).toBe(0)

		// Drain the root's initial batch so subsequent writes flush
		// their own runUpdates synchronously.
		await microtask()

		// switch from falsy to a past timestamp
		t.write((Date.now() - 3000) / 1000)
		const v = elapsed()
		expect(v >= 2 && v <= 5).toBe(true)

		// back to falsy → ticks should idle, accessor reads 0 again
		t.write(0)
		expect(elapsed()).toBe(0)

		dispose()
	})
})

await test('time - useElapsed ticks at the second boundary while diff < 1m', async expect => {
	await root(async dispose => {
		// 10 seconds ago — well within the per-second tick band
		const past = (Date.now() - 10_000) / 1000
		const elapsed = useElapsed(past)
		const start = elapsed()

		await sleep(1100)
		const later = elapsed()

		// after 1.1s the per-second ticker should have advanced the value
		expect(later >= start + 1).toBe(true)

		dispose()
	})
})
