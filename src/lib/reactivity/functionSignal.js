import { $default } from '../../constants.js'
import { signal } from './primitives/solid.js'

/**
 * A self contained signal function, when an argument is present it
 * writes to the signal, when theres no argument it reads the signal.
 *
 * @param {any} value? - Optional initial value
 * @returns {Signal}
 */
export function functionSignal(value) {
	const [read, write] = signal(value)
	return (v = $default) => (v !== $default ? write(v) : read())
}
