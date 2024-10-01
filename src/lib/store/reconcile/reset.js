import { batch, untrack } from '../../reactive.js'
import {
	copy,
	isArray,
	isObject,
	keys,
	morphedBetweenArrayAndObject,
} from '../../std.js'

/**
 * Resets from `target` whats defined in `source`
 *
 * ```js
 * import { reset } from 'pota/store'
 *
 * const target = { a: true, q: [1, 2] }
 * const source = { b: false, q: [] }
 *
 * reset(target, source)
 *
 * // target === { a:true, b: false, q: [] }
 * ```
 *
 * @template T
 * @param {T} target
 * @param {object} source
 */
export const reset = (target, source) =>
	batch(() => untrack(() => reconcile(target, copy(source))))

function reconcile(target, source, id) {
	for (id in source) {
		if (!(id in target)) {
			target[id] = source[id]
		} else {
			const prev = target[id]
			const next = source[id]

			if (isObject(next)) {
				if (morphedBetweenArrayAndObject(prev, next)) {
					// Morphed from object/array to the opposite array/object.
					target[id] = next
				} else if (isArray(next)) {
					target[id] = next
				} else if (keys(next).length === 0) {
					// when next value is an object and its empty, means reset object
					target[id] = next
				} else {
					// simple object
					reconcile(prev, next)
				}
			} else if (prev !== next) {
				// simple primitive value
				target[id] = next
			}
		}
	}
}
