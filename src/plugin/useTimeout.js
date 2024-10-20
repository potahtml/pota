import { cleanup, owned, withValue } from '../lib/reactive.js'

/**
 * Creates a `setTimeout` that autodisposes. The `delay` could be
 * reactive. The timeout is NOT started automatically.
 *
 * @param {Function} callback - Callback to run once delay completes
 * @param {Signal | number} delay - Delay number or signal
 * @param {any[]} args - Arguments to pass to the callback
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
