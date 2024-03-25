import { empty, keys } from '../std/@main.js'

/**
 * Proxies a signals property access so you dont have to call the
 * function
 *
 * @param {Signal} signal - Signal to proxy
 * @param {object} [target] - Target object for the proxy
 * @returns {object} Proxied signal
 */
export const proxy = (signal, target = empty()) =>
	new Proxy(target, {
		get(target, key, receiver) {
			return signal()[key]
		},
		has(target, key) {
			return key in signal()
		},
		ownKeys(target) {
			return keys(signal())
		},
		getOwnPropertyDescriptor(target, key) {
			return { enumerable: true, configurable: true }
		},
	})
