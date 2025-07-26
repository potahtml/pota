import { cleanup, owned, withValue } from '../lib/reactive.js'

export const now = () => Date.now()

export function date(timestamp = now()) {
	const o = new Date(timestamp)

	return (
		o.getFullYear() +
		'-' +
		(o.getMonth() + 1 < 10 ? '0' : '') +
		(o.getMonth() + 1) +
		'-' +
		(o.getDate() < 10 ? '0' : '') +
		o.getDate()
	)
}

export function datetime(timestamp = now()) {
	return date(timestamp) + ' ' + time(timestamp)
}

export function time(timestamp = now()) {
	return timeWithSeconds(timestamp).slice(0, -3)
}

export function timeWithSeconds(timestamp = now()) {
	const o = new Date(timestamp)

	return (
		(o.getHours() < 10 ? '0' : '') +
		o.getHours() +
		':' +
		(o.getMinutes() < 10 ? '0' : '') +
		o.getMinutes() +
		':' +
		(o.getSeconds() < 10 ? '0' : '') +
		o.getSeconds()
	)
}

export function day(timestamp = now(), lang = 'en') {
	const o = new Date(timestamp)

	// saturday, September 17, 2016
	return o.toLocaleDateString(lang, {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})
}

export function measure(name, cb, timeReport) {
	console.time(name)
	const start = performance.now()
	const r = cb()
	timeReport && timeReport(performance.now() - start)
	console.timeEnd(name)
	return r
}

export function timing(fn) {
	const start = performance.now()
	fn()
	return performance.now() - start
}

/**
 * Creates a `setTimeout` that autodisposes. The `delay` could be
 * reactive. The timeout is NOT started automatically.
 *
 * @template T
 * @param {(...args: unknown[]) => void} callback - Callback to run
 *   once delay completes
 * @param {Accessor<number>} delay - Delay number or signal
 * @param {unknown[]} args - Arguments to pass to the callback
 * @returns {{ start: Function; stop: Function }}
 */
export function useTimeout(callback, delay, ...args) {
	let id
	const fn = {
		start: () => {
			withValue(delay, delay => {
				fn.stop()
				if (delay < Infinity)
					id = setTimeout(owned(callback), delay, ...args)
			})
			return fn
		},

		stop: () => clearTimeout(id),
	}

	cleanup(fn.stop)

	return fn
}
