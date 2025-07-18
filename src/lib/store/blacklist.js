import {
	Symbol,
	getOwnValues,
	isSymbol,
	window,
	isGeneratorFunction,
} from '../std.js'

const constructorsTracked = [
	Object,
	Array,
	Map,
	undefined /** Object.create(null) */,
]

/**
 * Returns `true` when `object` can't be made mutable.
 *
 * @param {any} target
 */
export const isMutationBlacklisted = target =>
	constructorsBlacklist.has(target.constructor) ||
	isGeneratorFunction(target)

const constructorsBlacklist = new Set(
	Object.getOwnPropertyNames(window).map(value => window[value]),
)

constructorsTracked.forEach(value =>
	constructorsBlacklist.delete(value),
)

const prototypeBlacklist = new Set([
	...constructorsTracked,
	...constructorsBlacklist,
])

/**
 * Returns `true` when prototype is blacklisted. We won't gather
 * getters/setters from the object.
 *
 * @param {any} target
 */
export const isPrototypeBlacklisted = target =>
	prototypeBlacklist.has(target.constructor) ||
	isGeneratorFunction(target)

/**
 * Returns `true` when `key` is blacklisted. It won't be signalified.
 *
 * @param {PropertyKey} key
 */
export const isKeyBlacklisted = key => keyBlacklist.has(key)

/** @type Set<PropertyKey> */
const keyBlacklist = new Set([
	'constructor',
	'__proto__',
	...getOwnValues(Symbol).filter(isSymbol),
])

export function updateBlacklist(window) {
	new Set(
		Object.getOwnPropertyNames(window).map(value => window[value]),
	).forEach(x => {
		constructorsBlacklist.add(x)
		prototypeBlacklist.add(x)
	})

	constructorsTracked.forEach(x =>
		constructorsBlacklist.delete(window[x?.name]),
	)

	getOwnValues(window.Symbol)
		.filter(isSymbol)
		.forEach(x => keyBlacklist.add(x))
}
