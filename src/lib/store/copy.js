import { isArray, isObject } from '../std.js'
import { isMutationBlacklisted } from './blacklist.js'

/**
 * Copies an object leaving native/built-ins intact
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

	const c = /** @type {T} */ isArray(o)
		? []
		: /** @type {{ [key: string]: unknown }} */ ({})

	seen.set(o, c)

	for (const k in o) {
		c[k] = copy(o[k], seen)
	}
	return c
}
