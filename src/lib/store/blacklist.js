import {
	Promise,
	Symbol,
	getOwnValues,
	global,
	isSymbol,
} from '../std.js'

import { ProxyHandlerArray } from './proxies/array.js'
import { ProxyHandlerBase } from './proxies/base.js'
import { ProxyHandlerObject } from './proxies/object.js'

import { ReactiveArray } from './reactive/array.js'
import { ReactiveMap } from './reactive/map.js'

import { $track, $trackSlot, Track } from './tracker.js'

const { Iterator } = global

export const mutableBlacklist = [
	Date,
	Promise,
	RegExp,

	Set,
	// Map,

	Iterator,

	// handlers - to avoid walking the prototype
	ProxyHandlerBase,
	ProxyHandlerObject,
	ProxyHandlerArray,

	Track,
]

export const prototypeBlacklist = [
	Object,
	Array,
	Map,
	...mutableBlacklist,
]

export const keyBlacklist = [
	'constructor',
	'__proto__',
	$track,
	$trackSlot,
	...getOwnValues(Symbol).filter(isSymbol),
]

export const methodsBlacklist = [
	...getOwnValues(ReactiveMap.prototype),
	...getOwnValues(ReactiveArray.prototype),
]

/**
 * Returns `true` when `object` can't be made mutable.
 *
 * @param {any} target
 */
export const isMutationBlacklisted = target =>
	target === globalThis ||
	target instanceof Node ||
	mutableBlacklist.includes(target.constructor)

/**
 * Returns `true` when prototype is blacklisted. We won't gather
 * getters/setters from the object.
 *
 * @param {any} target
 */
export const isPrototypeBlacklisted = target =>
	prototypeBlacklist.includes(target.constructor) ||
	target[Symbol.toStringTag] === 'Generator'

/**
 * Returns `true` when `key` is blacklisted. It won't be signalified.
 *
 * @param {PropertyKey} key
 */
export const isKeyBlacklisted = key => keyBlacklist.includes(key)

/**
 * Returns `true` when `method` is blacklisted. It won't be
 * signalified.
 *
 * @param {Function} value
 */
export const isMethodBlacklisted = value =>
	methodsBlacklist.includes(value)
