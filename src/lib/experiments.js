/** Experiments/workarounds/quick hacks that didnt stabilize yet */

import { getValue, equals } from './std.js'

export function morphArray(oldData, setData) {
	return newData => {
		const fresh = getValue(newData)
		const stale = getValue(oldData)

		const r = []

		for (const after of fresh) {
			const before = stale.find(before => before.id === after.id)

			equals(before, after) ? r.push(before) : r.push(after)
		}
		setData(r)
	}
}
