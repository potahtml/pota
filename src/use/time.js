import {
	cleanup,
	owned,
	signal,
	syncEffect,
	withValue,
} from '../lib/reactive.js'
import { getValue } from '../lib/std.js'

/**
 * Native `Date.now()`.
 *
 * @returns {number}
 * @url https://pota.quack.uy/use/time/now
 */
export const now = () => Date.now()

/**
 * Formats a timestamp as YYYY-MM-DD.
 *
 * @param {number} [timestamp=now()] Default is `now()`
 * @returns {string}
 * @url https://pota.quack.uy/use/time/date
 */
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

/**
 * Formats a timestamp as YYYY-MM-DD HH:MM.
 *
 * @param {number} [timestamp=now()] Default is `now()`
 * @returns {string}
 * @url https://pota.quack.uy/use/time/datetime
 */
export function datetime(timestamp = now()) {
	return date(timestamp) + ' ' + time(timestamp)
}

/**
 * Formats a timestamp as HH:MM.
 *
 * @param {number} [timestamp=now()] Default is `now()`
 * @returns {string}
 * @url https://pota.quack.uy/use/time
 */
export function time(timestamp = now()) {
	return timeWithSeconds(timestamp).slice(0, -3)
}

/**
 * Formats a timestamp as HH:MM:SS.
 *
 * @param {number} [timestamp=now()] Default is `now()`
 * @returns {string}
 * @url https://pota.quack.uy/use/time/timeWithSeconds
 */
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

/**
 * Formats a timestamp using locale-aware weekday and date components.
 *
 * @param {number} [timestamp=now()] Default is `now()`
 * @param {Intl.LocalesArgument} [lang='en'] Default is `'en'`
 * @returns {string}
 * @url https://pota.quack.uy/use/time/day
 */
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

/**
 * Runs a function while reporting execution time via
 * console/timeReport.
 *
 * @template T
 * @param {string} name
 * @param {() => T} cb
 * @param {(duration: number) => void} [timeReport]
 * @returns {T}
 * @url https://pota.quack.uy/use/time/measure
 */
export function measure(name, cb, timeReport) {
	console.time(name)
	const start = performance.now()
	const r = cb()
	timeReport && timeReport(performance.now() - start)
	console.timeEnd(name)
	return r
}

/**
 * Measures the execution time of a function.
 *
 * @param {() => void} fn
 * @returns {number} Duration in milliseconds.
 * @url https://pota.quack.uy/use/time/timing
 */
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
 * @url https://pota.quack.uy/use/time/useTimeout
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

/**
 * Thresholds (in seconds) keyed to the divisor (in seconds) of the
 * unit they belong to. A diff < 60s ticks every 1s; < 1h ticks every
 * 60s; < 1d ticks every 3600s; and so on.
 *
 * @type {ReadonlyArray<readonly [number, number]>}
 */
const TICK_BOUNDARIES = [
	[60, 1],
	[3600, 60],
	[86400, 3600],
	[86400 * 30, 86400],
	[86400 * 365, 86400 * 30],
]
const YEAR_DIV = 86400 * 365

/**
 * @param {number} diffSec
 * @returns {number} Divisor (seconds) of the unit that diff currently
 *   lives in.
 */
const divisorFor = diffSec => {
	for (const [t, d] of TICK_BOUNDARIES) if (diffSec < t) return d
	return YEAR_DIV
}

/**
 * Reactive accessor of seconds elapsed since `timestamp` (Unix
 * seconds). Re-evaluates on the next unit boundary — once per second
 * under a minute, once per minute under an hour, once per hour under
 * a day, etc. — so subscribers re-render only when the displayed
 * value would change, not every second. Returns `0` when `timestamp`
 * is falsy, and stops ticking in that case. Auto-cleans on scope
 * dispose via the underlying `useTimeout`.
 *
 * @param {number | (() => number | undefined | null)} timestamp -
 *   Unix seconds. May be a value or an accessor.
 * @returns {() => number} Elapsed seconds since `timestamp`.
 * @url https://pota.quack.uy/use/time/useElapsed
 */
export function useElapsed(timestamp) {
	const s = signal(0)
	const compute = () => {
		const ts = getValue(timestamp)
		if (!ts) return 0
		return Math.max(0, now() / 1000 - ts)
	}
	// Track the timestamp accessor so reads reflect it immediately,
	// not just at the next tick. `now()` itself is non-reactive, so
	// this only re-runs when `timestamp` actually changes.
	syncEffect(() => s.write(compute()))
	useTimeout(
		() => s.write(compute()),
		() => {
			const ts = getValue(timestamp)
			if (!ts) return Infinity
			const diff = Math.max(0, now() / 1000 - ts)
			const divMs = divisorFor(diff) * 1000
			return Math.max(1000, divMs - ((diff * 1000) % divMs))
		},
	).start()
	return s.read
}

/**
 * Reactive stopwatch. Counts elapsed milliseconds while running;
 * `stop()` pauses (preserving the accumulated total), `start()`
 * resumes, `reset()` zeros it. The `elapsed` accessor updates on a
 * fixed interval — default `1000`ms, one tick per second. For finer
 * resolution either lower `interval` or drive it from
 * `useAnimationFrame` reading `now()` directly.
 *
 * Auto-cleans on scope dispose via the underlying `useTimeout`.
 *
 * @param {{ autoStart?: boolean; interval?: number }} [opts]
 * @returns {{
 * 	elapsed: () => number
 * 	running: () => boolean
 * 	start: () => any
 * 	stop: () => any
 * 	reset: () => any
 * }}
 * @url https://pota.quack.uy/use/time/useStopwatch
 */
export function useStopwatch(opts) {
	const interval = opts?.interval ?? 1000
	const elapsed = signal(0)
	const running = signal(false)
	let startedAt = 0
	let accumulated = 0

	const ticker = useTimeout(function tick() {
		// `running` is read without subscribing — we're inside the
		// setTimeout callback, not a reactive scope.
		elapsed.write(accumulated + (now() - startedAt))
		ticker.start()
	}, interval)

	const ctrl = {
		elapsed: elapsed.read,
		running: running.read,
		start: () => {
			if (running.read()) return ctrl
			startedAt = now()
			running.write(true)
			ticker.start()
			return ctrl
		},
		stop: () => {
			if (!running.read()) return ctrl
			accumulated += now() - startedAt
			running.write(false)
			ticker.stop()
			elapsed.write(accumulated)
			return ctrl
		},
		reset: () => {
			accumulated = 0
			startedAt = running.read() ? now() : 0
			elapsed.write(0)
			return ctrl
		},
	}

	if (opts?.autoStart) ctrl.start()

	return ctrl
}
