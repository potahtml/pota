/** Experiments/workarounds/quick hacks that didnt stabilize yet */

import { getValue, equals } from './std.js'

/**
 * This idea: to be used to patch a signal array with data that comes
 * from a server without losing references to what its already there
 * avoiding a store.
 *
 * @template {Array<{id: string}>} T
 * @param {T} oldData
 * @param {SignalSetter<T>} setData
 */
export function diffCrossRealm(oldData, setData) {
	/** @param {T} newData */
	return newData => {
		const stale = getValue(oldData)
		const fresh = getValue(newData)

		const r = /** @type {T} */ ([])

		for (const after of fresh) {
			const before = stale.find(before => before.id === after.id)

			equals(before, after) ? r.push(before) : r.push(after)
		}
		setData(r)
	}
}
