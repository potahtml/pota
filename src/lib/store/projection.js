import { untrack } from '../reactive.js'

import {
	isArray,
	isObject,
	isProxyValueReturnInvariant,
	reflectApply,
	reflectDeleteProperty,
	reflectGet,
	reflectGetOwnPropertyDescriptor,
	reflectHas,
	reflectOwnKeys,
	reflectSet,
} from '../std.js'
import { mutable } from './mutable.js'

const $isProjection = Symbol()

/**
 * Copy on write object. A projection uses its own store of proxies
 * because 1 projection shoulnt affect a different projection
 *
 * @template T
 * @param {T} value
 * @returns {import('#type/store.d.ts').Mutable<T>}
 * @url https://pota.quack.uy/store/project
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
		// @ts-expect-error
		if (proxies.has(value)) {
			// @ts-expect-error
			return proxies.get(value)
		}

		const proxy = mutable(
			new Proxy(
				isArray(value) ? [] : {},
				new Projection(value, proxies),
			),
		)
		// @ts-expect-error
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
	/**
	 * Tombstones — keys deleted on the projection that still exist on
	 * the source, so the projecting traps must stop falling through
	 * for them. Lazy: most projections never delete. A `set` of the
	 * key resurrects it.
	 *
	 * @type {Set<PropertyKey> | undefined}
	 */
	deleted

	constructor(source, root) {
		this.source = source
		this.root = root
	}
	isDeleted(key) {
		return this.deleted !== undefined && this.deleted.has(key)
	}
	set(target, key, value, proxy) {
		this.deleted !== undefined && this.deleted.delete(key)
		return reflectSet(target, key, project(value, this.root))
	}
	deleteProperty(target, key) {
		const r = reflectDeleteProperty(target, key)
		if (r && reflectHas(this.source, key)) {
			if (this.deleted === undefined) this.deleted = new Set()
			this.deleted.add(key)
		}
		return r
	}
	get(target, key, proxy) {
		if (key === $isProjection) {
			return this.root
		}

		if (
			!(key in target) &&
			!this.isDeleted(key) &&
			target !== this.source
		) {
			return this.get(this.source, key, proxy) // project
		}

		const value = reflectGet(target, key, proxy)

		return typeof value === 'function'
			? this.returnFunction(target, key, value)
			: this.returnValue(target, key, value)
	}
	getOwnPropertyDescriptor(target, key) {
		if (
			!(key in target) &&
			!this.isDeleted(key) &&
			target !== this.source
		) {
			return this.getOwnPropertyDescriptor(this.source, key)
		}

		return reflectGetOwnPropertyDescriptor(target, key)
	}
	ownKeys(target) {
		const sourceKeys = reflectOwnKeys(this.source)
		return [
			...new Set(
				reflectOwnKeys(target).concat(
					this.deleted === undefined
						? sourceKeys
						: sourceKeys.filter(key => !this.deleted.has(key)),
				),
			),
		]
	}
	has(target, key) {
		return (
			reflectHas(target, key) ||
			(!this.isDeleted(key) && reflectHas(this.source, key))
		)
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
