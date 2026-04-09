/** @jsxImportSource pota */

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
