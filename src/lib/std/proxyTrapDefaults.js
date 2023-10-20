export const proxyTrapDefaults = {
	getOwnPropertyDescriptor(target, key) {
		return { enumerable: true, configurable: true }
	},
}
