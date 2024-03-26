import { ArrayPrototype } from '../../std/ArrayPrototype.js'
import { isArray } from '../../std/isArray.js'
import { isObject } from '../../std/isObject.js'
import { replacePrototypeWith } from '../../std/replacePrototypeWith.js'
import { weakStore } from '../../std/weakStore.js'

import { ProxyHandlerArray } from './proxies/array.js'
import { ProxyHandlerObject } from './proxies/object.js'
import { ReactiveArray } from './reactive/array.js'

import { isBlacklisted } from './blacklist.js'
import { signalifyObject } from './signalify.js'

/** Keeps track of what objects have already been made into a proxy */
const [getProxy, setProxy] = new weakStore()

const saveProxy = (value, proxy) => {
	setProxy(value, proxy)
	if (value !== proxy) setProxy(proxy, proxy)
	return proxy
}

/**
 * Makes a recursive modifiable and trackeable object. Transforms in
 * place properties into signals via get/set. Works with inherited
 * getters/setters.
 *
 * @template T
 * @param {GenericObject<T>} value
 * @returns {GenericObject<T>}
 */
export function mutable(value) {
	/** Return value as is when is not an object */
	if (!isObject(value)) {
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
	if (isBlacklisted(value)) {
		return saveProxy(value, value)
	}

	/**
	 * Arrays methods are proxied by changing their prototype to be
	 * `ReactiveArray extends Array`. ReactiveArray is also proxied so
	 * functions can be batched.
	 */
	if (isArray(value)) {
		if (value instanceof ReactiveArray) {
			/**
			 * If the Array is already an instance of ReactiveArray and not
			 * proxied (we didn't find a proxy for it a few lines above),
			 * then its a new copy of itself. For example, `array.slice()`
			 * will return a new array of class `ReactiveArray`.
			 */

			proxy = new Proxy(value, new ProxyHandlerArray(value))

			return saveProxy(value, proxy)
		}

		/** Class MyClass extends ... extends Array {} */
		replacePrototypeWith(value, ArrayPrototype, new ReactiveArray())

		proxy = new Proxy(value, new ProxyHandlerArray(value))

		/**
		 * First save it, then mutate content, in case `mutable` triggers
		 * `mutable` before we have a chance to save it as a proxy. To
		 * avoid the posible situation of having 2 different proxies for
		 * the same value.
		 */
		saveProxy(value, proxy)

		/** Make the content of the array mutable. */
		value.forEach((value, k, values) => {
			values[k] = mutable(value)
		})

		return proxy
	}

	/** Its an object */
	proxy = new Proxy(value, new ProxyHandlerObject(value))

	/**
	 * First save it, then signalify it, in case `signalify` triggers
	 * `mutable` before we have a chance to save it as a proxy. To avoid
	 * the posible situation of having 2 different proxies for the same
	 * value.
	 */
	saveProxy(value, proxy)

	signalifyObject(value, mutable)

	return proxy
}
