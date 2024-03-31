import { getOwnPropertyNames } from './getOwnPropertyNames.js'

export const getOwnValues = o =>
	getOwnPropertyNames(o).map(key => {
		try {
			return o[key]
		} catch (e) {}
	})
