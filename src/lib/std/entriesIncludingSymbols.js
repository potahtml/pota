import { entries } from './entries.js'
import { getOwnPropertySymbols } from './getOwnPropertySymbols.js'
import { iterator } from './iterator.js'

export const entriesIncludingSymbols = target => ({
	*[iterator]() {
		for (const item of entries(target)) {
			yield item
		}

		for (const item of getOwnPropertySymbols(target)) {
			yield [item, target[item]]
		}
	},
})
