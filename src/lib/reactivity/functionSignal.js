import { markReactive } from './markReactive.js'
import { signal } from './primitives/solid.js'

/**
 * A self contained signal function, when an argument is present it
 * writes to the signal, when theres no argument it reads the signal.
 *
 * @param {any} [value] - Optional initial value
 * @returns {((...args) => any) | (() => any)}
 */
export function functionSignal(value) {
	const [read, write] = signal(value)
	return markReactive((...args) =>
		args.length ? write(args[0]) : read(),
	)
}
