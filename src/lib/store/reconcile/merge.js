// https://github.com/mobxjs/mobx/issues/1590

import { batch, untrack } from '../../reactive.js'
import {
	indexByKey,
	isArray,
	isObject,
	isString,
	morphedBetweenArrayAndObject,
	values,
} from '../../std.js'
import { copy } from '../copy.js'

/**
 * Merge `source` into `target`. Returns `target` for convenience; the
 * returned reference is the same object that was passed in.
 *
 * ```js
 * import { merge } from 'pota/store'
 *
 * const target = { a: true, q: [1, 2] }
 * const source = { b: true, q: [3] }
 *
 * merge(target, source)
 *
 * // target === { a: true, b: true, q: [3, 2] }
 * ```
 *
 * ```js
 * import { merge } from 'pota/store'
 *
 * // merge using keys keeps the references
 *
 * const target = {
 * 	a: true,
 * 	q: [{ id: 0 }, { id: 1, name: 'Quack' }],
 * }
 *
 * const source = {
 * 	b: true,
 * 	q: [{ id: 3 }, { id: 2 }, { id: 1, lastName: 'Murci' }],
 * }
 *
 * const ref = target.q[1]
 *
 * merge(target, source, { q: { key: 'id' } })
 *
 * console.log(ref === target.q[1])
 *
 * // target === {"a":true,"q":[ {"id":0}, {"id":1,"name":"Quack","lastName":"Murci"}, {"id":3}, {"id":2}],"b":true}
 * ```
 *
 * @template T
 * @template U
 * @param {T} target
 * @param {U} source
 * @param {import('#type/store.d.ts').KeysOption<U>} [keys] Keeps
 *   references on objects with the same key. Shape mirrors `source`:
 *   reconcile iterates source, so only arrays present in source are
 *   relevant to this option.
 * @returns {T & U}
 */
export const merge = (target, source, keys) => (
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
}

const getKeys = (keys, id) =>
	keys && id in keys ? keys[id] : undefined
