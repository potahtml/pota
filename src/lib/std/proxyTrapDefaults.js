// I may be missing stuff here

export const proxyTrapDefaults = {
	getOwnPropertyDescriptor(target, key) {
		return { enumerable: true, configurable: true }
	},
}
