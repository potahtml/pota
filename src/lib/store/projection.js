import { usePrevious } from '../../use/selector.js'
import { memo, untrack } from '../reactive.js'

import {
	isArray,
	isObject,
	isProxyValueReturnInvariant,
	reflectApply,
	reflectGet,
	reflectGetOwnPropertyDescriptor,
	reflectHas,
	reflectOwnKeys,
	reflectSet,
} from '../std.js'
import { mutable } from './mutable.js'

// TODO: replace with a proper `createFirewall`
export function firewall(fn) {
	memo(usePrevious(fn))()
}

const $isProjection = Symbol()

/**
 * Copy on write object
 *
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function project(value, proxies = new WeakMap()) {
	if (!isObject(value)) {
		return value
	}

	return untrack(() => {
		// this happens becuase the Projection proxy gets wrapped in a mutable
		if (value[$isProjection] === proxies) {
			return value
		}

		if (proxies.has(value)) {
			return proxies.get(value)
		}

		const proxy = mutable(
			new Proxy(
				isArray(value) ? [] : {},
				new Projection(value, proxies),
			),
		)

		proxies.set(value, proxy)

		if (isArray(value)) {
			for (const k in value) {
				proxy[k] = value[k]
			}
		}

		return proxy
	})
}

class Projection {
	constructor(source, root) {
		this.source = source
		this.root = root
	}
	set(target, key, value, proxy) {
		return reflectSet(target, key, project(value, this.root))
	}
	get(target, key, proxy) {
		if (key === $isProjection) {
			return this.root
		}

		if (!(key in target) && target !== this.source) {
			return this.get(this.source, key, proxy) // project
		}

		const value = reflectGet(target, key, proxy)

		return typeof value === 'function'
			? this.returnFunction(target, key, value)
			: this.returnValue(target, key, value)
	}
	getOwnPropertyDescriptor(target, key) {
		if (!(key in target) && target !== this.source) {
			return this.getOwnPropertyDescriptor(this.source, key)
		}

		return reflectGetOwnPropertyDescriptor(target, key)
	}
	ownKeys(target) {
		return [
			...new Set(
				reflectOwnKeys(target).concat(reflectOwnKeys(this.source)),
			),
		]
	}
	has(target, key) {
		return reflectHas(target, key) || reflectHas(this.source, key)
	}

	returnValue(target, key, value) {
		return isProxyValueReturnInvariant(target, key, value)
			? value
			: project(value, this.root)
	}
	returnFunction(target, key, value) {
		/**
		 * 1. `Reflect.apply` to correct `receiver`. `TypeError: Method
		 *    Set.prototype.add called on incompatible receiver #<Set>`
		 * 2. Run in a batch to react to all changes at the same time.
		 */
		return (...args) =>
			project(reflectApply(value, target, args), this.root)
	}
}
