import { empty, keys, proxyTrapDefaults } from '#std'

/**
 * Proxies a signals property access so you dont have to call the
 * function
 *
 * @param {pota.signal} signal - Signal to proxy
 * @param {object} [target] - Target object for the proxy
 * @returns {object} Proxied signal
 */
export function proxy(signal, target = empty()) {
	return new Proxy(target, {
		get(target, key, receiver) {
			return signal()[key]
		},
		has(target, key) {
			return key in signal()
		},
		ownKeys(target) {
			return keys(signal())
		},
		...proxyTrapDefaults,
	})
}
