// https://github.com/mobxjs/mobx/issues/1590

import { batch, untrack } from '../../reactive.js'
import {
	indexByKey,
	isArray,
	isObject,
	isString,
	morphedBetweenArrayAndObject,
	removeFromArrayConditionally,
	values,
} from '../../std.js'
import { copy } from '../copy.js'

/**
 * Merge `source` into `target` and removes from `target` keys not
 * present in `source`. Returns `target` for convenience; the returned
 * reference is the same object that was passed in. Note that the
 * returned type `T & U` approximates the final shape — keys of `T`
 * absent from `U` are deleted at runtime but still appear in the
 * returned type.
 *
 * ```js
 * import { replace } from 'pota/store'
 *
 * const target = { a: true, q: [1, 2] }
 * const source = { b: true, q: [3] }
 *
 * replace(target, source)
 *
 * // target === { b: true, q: [3] }
 * ```
 *
 * ```js
 * import { replace } from 'pota/store'
 *
 * // replacing using keys keeps the references
 *
 * const target = {
 * 	a: true,
 * 	q: [{ id: 0 }, { id: 1, name: 'Quack' }],
 * }
 *
 * const source = {
 * 	b: true,
 * 	q: [{ id: 1, lastName: 'Murci' }],
 * }
 *
 * const ref = target.q[1]
 *
 * // replace moving target.q[1] to target.q[0]
 *
 * replace(target, source, { q: { key: 'id' } })
 *
 * console.log(ref === target.q[0])
 *
 * // target === { "q": [{ "id": 1, "lastName": "Murci" }], "b": true }
 * ```
 *
 * @template T
 * @template U
 * @param {T} target
 * @param {U} source
 * @param {import('#type/store.d.ts').KeysOption<U>} [keys] Keep
 *   references on objects with the same key. Shape mirrors `source`.
 * @returns {T & U}
 */
export const replace = (target, source, keys) => (
	batch(() =>
		untrack(() => reconcile(target, copy(source), keys, '')),
	),
	/** @type {T & U} */ (target)
)

function reconcile(target, source, keys, id, inArray) {
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
					const _keys = getKeys(keys, id)
					const key =
						_keys && values(_keys).find(item => isString(item))

					// merge or add by key
					if (_keys && key) {
						let byKey

						// in replace mode first remove `prevs` not found in `next`

						// index array next
						byKey = indexByKey(next, key)
						// remove
						removeFromArrayConditionally(
							prev,
							(i, item) => !byKey[item[key]],
						)

						// index array prev
						byKey = indexByKey(prev, key)

						// merge or push
						for (const item of next) {
							const has = byKey[item[key]]
							!has ? prev.push(item) : reconcile(has, item, _keys, id)
						}
					} else {
						reconcile(prev, next, _keys, id, true)
					}
				} else {
					// simple object
					reconcile(
						prev,
						next,
						inArray ? keys : getKeys(keys, id),
						id,
					)
				}
			} else if (prev !== next) {
				// simple primitive value
				target[id] = next
			}
		}
	}

	// remove

	if (isArray(target)) {
		target.length = source.length
	} else {
		for (id in target) {
			if (!(id in source)) {
				delete target[id]
			}
		}
	}
}

const getKeys = (keys, id) =>
	keys && id in keys ? keys[id] : undefined
