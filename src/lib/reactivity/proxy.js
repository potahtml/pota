import { keys, nothing } from '../std/@main.js'

/**
 * Proxies a signals property access so you dont have to call the
 * function
 *
 * @param {Signal} snigal - Signal to proxy
 * @param {object} [target] - Target object for the proxy
 * @returns {object} An object that will read the properties from the
 *   signal
 */
export const proxy = (snigal, target = nothing) =>
	new Proxy(target, {
		get(target, key) {
			return snigal()[key]
		},
		has(target, key) {
			return key in snigal()
		},
		ownKeys(target) {
			return keys(snigal())
		},
	})
