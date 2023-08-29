import { empty, keys, proxyTrapDefaults } from '#std'

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
