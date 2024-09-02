// https://github.com/mobxjs/mobx/issues/1590

import { batch, untrack } from '../reactive.js'
import {
	indexByKey,
	isArray,
	isObject,
	isString,
	morphedBetweenArrayAndObject,
	keys as objectKeys,
	removeFromArrayConditionally,
	values,
} from '../std.js'

/**
 * Merge `source` into `target`
 *
 * ```js
 * const target = { a: true, q: [1, 2] }
 * const source = { b: true, q: [3] }
 *
 * merge(target, source)
 *
 * // target === { a: true, b: true, q: [3, 2] }
 * ```
 *
 * ```js
 * import { render, signal, memo, effect } from 'pota'
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
 * @param {T} target
 * @param {object} source
 * @param {object} [keys] Keeps references on objects with the same
 *   key
 */
export const merge = (target, source, keys) =>
	batch(() =>
		untrack(() => reconcile(target, source, keys, '', false)),
	)

/**
 * Merge `source` into `target` and removes from `target` keys not
 * present in `source`
 *
 * ```js
 * const target = { a: true, q: [1, 2] }
 * const source = { b: true, q: [3] }
 *
 * replace(target, source)
 *
 * // target === { b: true, q: [3] }
 * ```
 *
 * ```js
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
 * @param {T} target
 * @param {object} source
 * @param {object} [keys] Keep references on objects with the same key
 */
export const replace = (target, source, keys) =>
	batch(() =>
		untrack(() => reconcile(target, source, keys, '', true)),
	)

function reconcile(target, source, keys, id, remove, inArray) {
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
						if (remove) {
							// index array next
							byKey = indexByKey(next, key)
							// remove
							removeFromArrayConditionally(
								prev,
								item => !byKey[item[key]],
							)
						}

						// index array prev
						byKey = indexByKey(prev, key)

						// merge or merge
						for (const item of next) {
							const has = byKey[item[key]]
							!has
								? prev.push(item)
								: reconcile(has, item, _keys, id, remove)
						}
					} else {
						reconcile(prev, next, _keys, id, remove, true)
					}
				} else {
					// simple object
					reconcile(
						prev,
						next,
						inArray ? keys : getKeys(keys, id),
						id,
						remove,
					)
				}
			} else if (prev !== next) {
				// simple primitive value
				target[id] = next
			}
		}
	}

	// remove
	if (remove) {
		/** Iterate it in reverse because splice moves the whole thing */
		const inArray = isArray(target)

		for (id of objectKeys(target).reverse()) {
			if (!(id in source)) {
				inArray ? target.splice(id, 1) : delete target[id]
			}
		}
	}
}

const getKeys = (keys, id) =>
	keys && id in keys ? keys[id] : undefined
