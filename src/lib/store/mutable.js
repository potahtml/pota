import { isArray, isObject, weakStore } from '../std.js'

import { untrack } from '../reactive.js'

import { ProxyHandlerArray } from './proxies/array.js'
import { ProxyHandlerObject } from './proxies/object.js'
import { ProxyHandlerMap } from './proxies/map.js'

import { isMutationBlacklisted } from './blacklist.js'

import { signalifyObject } from './signalify.js'
import { copy } from './copy.js'
import { $isMutable } from '../../constants.js'

/** Keeps track of what objects have already been made into a proxy */
const [getProxy, setProxy] = weakStore()

function createProxy(target, Handler) {
	const proxy = new Proxy(target, new Handler(target))
	/**
	 * Before mutating the content of it (for example calling
	 * `signalifyObject` or making the content of an array mutable),
	 * save it. In case the mutation triggers `mutable` on the same object, before we have a
	 * chance to save it as a proxy. To avoid the posible situation of
	 * having 2 different proxies for the same value.
	 */
	setProxy(target, proxy)
	return proxy
}

/**
 * Makes a recursive modifiable and trackeable object. Transforms in
 * place properties into signals via get/set. Works with inherited
 * getters/setters.
 *
 * @template T
 * @param {T} value
 * @param {boolean} [clone] - If to `copy` the value first
 * @returns {T}
 */
export function mutable(value, clone) {
	/** Return value as is when is not an object */
	if (!isObject(value)) {
		return value
	}

	/** Make a copy to avoid modifying original data (optional) */
	value = clone ? copy(value) : value

	/** Avoid unwrapping external proxies */
	if (value[$isMutable]) {
		return value
	}

	/**
	 * Return `proxy` if already exists for `value`. It could be
	 * possible that `value` is a `proxy`, which is already saved, so it
	 * will return the same thing.
	 */
	let proxy = getProxy(value)
	if (proxy) {
		return proxy
	}

	/**
	 * Values like Date, RegExp, HTMLElement are not proxied. The
	 * blacklist can be customized by editing the set from blacklist.js
	 */
	if (isMutationBlacklisted(value)) {
		setProxy(value, value)
		return value
	}

	/**
	 * Array methods are proxied by ProxyHandlerArray
	 */
	if (isArray(value)) {
		proxy = createProxy(value, ProxyHandlerArray)

		/** Make the content of the array mutable. */
		untrack(() =>
			value.forEach((value, key, array) => {
				array[key] = mutable(value)
			}),
		)

		return proxy
	}

	/**
	 * Map methods are proxied by ProxyHandlerMap
	 */
	if (value instanceof Map) {
		proxy = createProxy(value, ProxyHandlerMap)

		/** Make the content mutable. */
		untrack(() =>
			value.forEach((value, key, map) => {
				map.set(key, mutable(value))
			}),
		)

		return proxy
	}

	/** An intance of something we dont have a special handler for it */
	proxy = createProxy(value, ProxyHandlerObject)

	signalifyObject(value, mutable)

	return proxy
}
