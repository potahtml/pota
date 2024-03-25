import { getOwnPropertyNames } from '../../std/getOwnPropertyNames.js'
import { global } from '../../std/global.js'
import { identity } from '../../std/identity.js'
import { isSymbol } from '../../std/isSymbol.js'
import { Symbol } from '../../std/Symbol.js'

/**
 * Returns `true` when object is blacklisted. It won't be proxied.
 *
 * @param {any} value
 */
export function isBlacklisted(value) {
	return classes.has(value.constructor)
}

const { HTMLElement, HTMLDivElement, Iterator } = global

export const classes = new Set(
	[
		Date,
		Promise,
		RegExp,

		HTMLElement,
		HTMLDivElement,

		Set,
		Map,

		Iterator,
	].filter(identity),
)

/**
 * Returns `true` when `key` is blacklisted. It won't be signalified.
 *
 * @param {PropertyKey} key
 */
export const isKeyBlacklisted = key =>
	key === 'constructor' || (isSymbol(key) && symbols.has(key))

export const symbols = new Set(
	getOwnPropertyNames(Symbol)
		.map(key => {
			try {
				return Symbol[key]
			} catch (e) {}
		})
		.filter(isSymbol),
)
