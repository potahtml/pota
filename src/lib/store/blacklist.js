import {
	Promise,
	PrototypeArray,
	PrototypeMap,
	Symbol,
	getOwnValues,
	global,
	identity,
	isFunction,
	isSymbol,
} from '../std.js'

import { ProxyHandlerArray } from './proxies/array.js'
import { ProxyHandlerBase } from './proxies/base.js'
import { ProxyHandlerObject } from './proxies/object.js'

import { ReactiveArray } from './reactive/array.js'
import { ReactiveMap } from './reactive/map.js'

import { $track, $trackSlot, Track } from './tracker.js'

/**
 * Returns `true` when `object` can't be made mutable.
 *
 * @param {any} target
 */
export function isMutationBlacklisted(target) {
	return mutableBlacklist.has(target.constructor)
}

const { HTMLElement, HTMLDivElement, Iterator } = global

export const mutableBlacklist = new Set(
	[
		Date,
		Promise,
		RegExp,

		HTMLElement,
		HTMLDivElement,

		Set,
		// Map,

		Iterator,

		// handlers - to avoid walking the prototype
		ProxyHandlerBase,
		ProxyHandlerObject,
		ProxyHandlerArray,

		Track,
	].filter(identity),
)

/**
 * Returns `true` when prototype is blacklisted. We won't gather
 * getters/setters from the object.
 *
 * @param {any} target
 */
export function isPrototypeBlacklisted(target) {
	return (
		prototypeBlacklist.has(target.constructor) ||
		target[Symbol.toStringTag] === 'Generator'
	)
}

export const prototypeBlacklist = new Set(
	[Object, Array, Map, ...mutableBlacklist].filter(identity),
)

/**
 * Returns `true` when `key` is blacklisted. It won't be signalified.
 *
 * @param {PropertyKey} key
 */
export const isKeyBlacklisted = key => keyBlacklist.has(key)

export const keyBlacklist = new Set([
	'constructor',
	'__proto__',
	$track,
	$trackSlot,
	...getOwnValues(Symbol).filter(isSymbol),
])

/**
 * Returns `true` when `method` is blacklisted. It won't be
 * signalified.
 *
 * @param {Function} value
 */
export const isMethodBlacklisted = value =>
	methodsBlacklist.has(value)

export const methodsBlacklist = new Set(
	[
		...getOwnValues(ReactiveMap.prototype),
		...getOwnValues(ReactiveArray.prototype),
		...getOwnValues(PrototypeMap),
		...getOwnValues(PrototypeArray),
	]
		.filter(identity)
		.filter(isFunction),
)
