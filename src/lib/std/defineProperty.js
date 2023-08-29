const define = Object.defineProperty

const defaults = {
	enumerable: true,
	configurable: true,
}

export function defineProperty(target, key, descriptor) {
	define(target, key, {
		...descriptor,
		...defaults,
	})
}
