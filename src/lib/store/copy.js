import { isArray, isObject } from '../std.js'
import { untrack } from '../reactive.js'
import { isMutationBlacklisted } from './blacklist.js'

/**
 * Deep-copies a value, preserving as much fidelity as practical:
 *
 * - Arrays, Sets, and Maps are reconstructed with their native types.
 * - Prototype chain is preserved (class instances stay `instanceof`
 *   their class).
 * - Own string AND symbol keys are copied, including non-enumerable
 *   properties and full descriptor attributes (writable, enumerable,
 *   configurable).
 * - Accessor descriptors are snapshotted: the getter is invoked once
 *   (inside `untrack` so reactive reads don't leak) and the result is
 *   stored as data on the copy. The original accessor shape is lost
 *   — copy returns a value snapshot, not a live recomputing view.
 * - Cycles are handled via the `seen` map.
 * - Frozen / sealed / non-extensible state is re-applied.
 * - Built-ins listed in `isMutationBlacklisted` (Date, RegExp,
 *   HTMLElement, …) are returned by reference.
 *
 * @template T
 * @param {T} o
 * @returns {T}
 */
export function copy(o, seen = new Map()) {
	if (!isObject(o)) {
		return o
	}

	if (isMutationBlacklisted(o)) {
		return o
	}

	if (seen.has(o)) {
		return /** @type {T} */ (seen.get(o))
	}

	let c
	if (isArray(o)) {
		c = []
	} else if (o instanceof Set) {
		c = new Set()
	} else if (o instanceof Map) {
		c = new Map()
	} else {
		// Preserve prototype for class instances.
		c = Object.create(Object.getPrototypeOf(o))
	}

	seen.set(o, c)

	// Collection contents. Done before the own-properties loop so
	// circular cycles register in `seen` consistently.
	if (o instanceof Set) {
		for (const v of o) c.add(copy(v, seen))
	} else if (o instanceof Map) {
		for (const [k, v] of o) {
			c.set(copy(k, seen), copy(v, seen))
		}
	}

	// Own keys (string + symbol, enumerable + non-enumerable).
	for (const k of Reflect.ownKeys(o)) {
		const desc = Object.getOwnPropertyDescriptor(o, k)
		if (!desc) continue

		let value
		if ('value' in desc) {
			value = copy(desc.value, seen)
		} else if (desc.get) {
			// Snapshot: invoke getter once, untracked.
			try {
				value = copy(
					untrack(() => desc.get.call(o)),
					seen,
				)
			} catch {}
		}

		Object.defineProperty(c, k, {
			value,
			writable: 'value' in desc ? desc.writable : true,
			enumerable: desc.enumerable,
			configurable: desc.configurable,
		})
	}

	// Preserve frozen / sealed / non-extensible state.
	if (Object.isFrozen(o)) Object.freeze(c)
	else if (Object.isSealed(o)) Object.seal(c)
	else if (!Object.isExtensible(o)) Object.preventExtensions(c)

	return /** @type {T} */ (c)
}
