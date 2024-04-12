import { definePropertyReadOnly } from '../../std/definePropertyReadOnly.js'
import { isArray } from '../../std/isArray.js'
import { isObject } from '../../std/isObject.js'
import { PrototypeArray } from '../../std/PrototypeArray.js'
import { PrototypeMap } from '../../std/PrototypeMap.js'
import { replacePrototypeWith } from '../../std/replacePrototypeWith.js'
import { weakStore } from '../../std/weakStore.js'

import { untrack } from '../reactive.js'

import { ProxyHandlerArray } from './proxies/array.js'
import { ProxyHandlerObject } from './proxies/object.js'

import { ReactiveArray } from './reactive/array.js'
import { ReactiveMap } from './reactive/map.js'

import { isMutationBlacklisted } from './blacklist.js'
import { signalifyObject } from './signalify.js'
import { $track } from './tracker.js'

/** Keeps track of what objects have already been made into a proxy */
const [getProxy, setProxy] = new weakStore()

const saveProxy = (value, proxy) => {
	setProxy(value, proxy)
	if (value !== proxy) setProxy(proxy, proxy)
	return proxy
}

function createProxy(target, Handler, setTrack = true) {
	const handler = new Handler(target)
	setTrack && definePropertyReadOnly(target, $track, handler)
	const proxy = new Proxy(target, handler)

	/**
	 * Before mutating the content of it (for example calling
	 * `signalifyObject` or making the content of an array mutable),
	 * save it. In case the mutation triggers `mutable` before we have a
	 * chance to save it as a proxy. To avoid the posible situation of
	 * having 2 different proxies for the same value.
	 */
	saveProxy(target, proxy)

	return proxy
}

/**
 * Makes a recursive modifiable and trackeable object. Transforms in
 * place properties into signals via get/set. Works with inherited
 * getters/setters.
 *
 * @template T
 * @param {GenericObject<T>} value
 * @returns {T}
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
	if (isMutationBlacklisted(value)) {
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
			 * If value is already an instance of ReactiveArray and not
			 * proxied (we didn't find a proxy for it a few lines above),
			 * then its a new copy of itself. For example, `array.slice()`
			 * will return a new array of class `ReactiveArray`.
			 */
			return createProxy(value, ProxyHandlerArray)
		}

		/** Class MyClass extends ... extends Array {} */
		replacePrototypeWith(value, PrototypeArray, new ReactiveArray())

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
	 * Map methods are proxied by changing their prototype to be
	 * `ReactiveMap extends Map`. ReactiveMap is also proxied so
	 * functions can be batched.
	 */
	if (value instanceof Map) {
		if (value instanceof ReactiveMap) {
			/**
			 * If value is already an instance of ReactiveMap and not
			 * proxied (we didn't find a proxy for it a few lines above),
			 * then its a new copy of itself.
			 */

			proxy = createProxy(value, ProxyHandlerObject)

			signalifyObject(value, mutable)

			return proxy
		}

		/** Class MyClass extends ... extends Map {} */
		replacePrototypeWith(value, PrototypeMap, new ReactiveMap())

		proxy = createProxy(value, ProxyHandlerObject)

		/** Make the content mutable. */
		untrack(() =>
			value.forEach((value, key, map) =>
				map.set(key, mutable(value)),
			),
		)

		signalifyObject(value, mutable)

		return proxy
	}

	/** Its an intance of something we dont have a special handler for it */
	proxy = createProxy(value, ProxyHandlerObject, false)

	signalifyObject(value, mutable)

	return proxy
}
