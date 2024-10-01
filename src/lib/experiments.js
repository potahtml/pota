/** Experiments/workarounds/quick hacks that didnt stabilize yet */

import { getValue, equals } from './std.js'

/**
 * This idea: to be used to patch a signal array with data that comes
 * from a server without losing references to what its already there
 * avoiding a store
 */
export function diffArrayFromServer(oldData, setData) {
	return newData => {
		const stale = getValue(oldData)
		const fresh = getValue(newData)

		const r = []

		for (const after of fresh) {
			const before = stale.find(before => before.id === after.id)

			equals(before, after) ? r.push(before) : r.push(after)
		}
		setData(r)
	}
}
