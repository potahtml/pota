import { entries } from './entries.js'
import { getOwnPropertySymbols } from './getOwnPropertySymbols.js'

export function* entriesIncludingSymbols(target) {
	for (const item of entries(target)) {
		yield item
	}

	for (const item of getOwnPropertySymbols(target)) {
		// todo: causes access!
		yield [item, target[item]]
	}
}
