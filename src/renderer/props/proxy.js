export const proxies = []
export const hasProxy = { value: false }

/**
 * Defines a props proxy that will proxy all of the props, except
 * children. This could be used to rename attributes/properties or to
 * change values.
 *
 * @param {(prop: { name; value }) => void} fn - Proxy function that
 *   changes by reference the name and/or value of the prop sent as
 *   argument
 * @url https://pota.quack.uy/props/propsProxy
 */
export const propsProxy = fn => {
	proxies.push(fn)
	hasProxy.value = true
}

export const proxy = (name, value) => {
	const prop = {
		name,
		value,
	}
	for (const proxy of proxies) {
		proxy(prop)
	}
	return prop
}
