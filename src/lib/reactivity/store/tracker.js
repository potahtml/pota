import { empty } from '../../std/empty.js'
import { isFunction } from '../../std/isFunction.js'
import { signal } from '../primitives/solid.js'

const Tracked = new WeakMap()
export const uninitialized = Symbol()

export function tracker(target) {
	let track = Tracked.get(target)
	if (!track) {
		// for tracking self
		const [read, write] = signal(null, {
			equals: false,
		})

		// for tracking properties
		const properties = empty()
		const signals = (key, value) => {
			if (!properties[key]) {
				properties[key] = signal(value)
			}
			return properties[key]
		}

		// tracker
		track = {
			read(key, value) {
				if (key !== undefined) {
					/**
					 * Initialize key in case is not initialized yet (think
					 * reading before writing)
					 */
					const signal = signals(key, value)

					/** Do not write to the signal here it will cause a loop */

					// track by reading, return passed value
					return signal[0](), value
				}
				return read() // read object
			},
			write(key, value) {
				// log('WRITE', key)

				if (key !== undefined) {
					// write/initialize key
					/**
					 * It writes the real value because tracking will re-execute
					 * only when value changed
					 */
					signals(key, value)[1](
						isFunction(value) ? () => value : value,
					)
				} else {
					// write object
					write(null)
				}
			},
		}
		Tracked.set(target, track)
	}

	return track
}

function log(...args) {
	//console.log(...args)
}
