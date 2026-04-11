/** @jsxImportSource pota */
// Tests for pota/use/time: date/time/datetime formatters, measure,
// timing, and useTimeout (start, stop, reactive delay).

import { test, sleep } from '#test'

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
		const timer = useTimeout(
			() => calls.push('fired'),
			10,
		)

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

