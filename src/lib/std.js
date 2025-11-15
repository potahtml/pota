export const window = globalThis

export const requestAnimationFrame = window.requestAnimationFrame
export const queueMicrotask = window.queueMicrotask

export const history = window.history
export const navigator = window.navigator
export const location = window.location
export const origin = location?.origin

export const Object = window.Object
export const Array = window.Array
export const Promise = window.Promise
export const Symbol = window.Symbol

export const assign = Object.assign
export const create = Object.create
export const defineProperties = Object.defineProperties
export const defineProperty = Object.defineProperty
export const entries = Object.entries
export const freeze = Object.freeze
export const fromEntries = Object.fromEntries
export const getOwnPropertyDescriptor =
	Object.getOwnPropertyDescriptor
export const getOwnPropertyDescriptors =
	Object.getOwnPropertyDescriptors
export const getOwnPropertyNames = Object.getOwnPropertyNames
export const getOwnPropertySymbols = Object.getOwnPropertySymbols
export const getPrototypeOf = Object.getPrototypeOf
export const groupBy = Object.groupBy
export const hasOwn = Object.hasOwn
export const is = Object.is
export const isExtensible = Object.isExtensible
export const keys = Object.keys
export const values = Object.values
export const setPrototypeOf = Object.setPrototypeOf

export const toArray = Array.from

/**
 * @template T
 * @param {T} value
 */
export const toValues = value =>
	isArray(value)
		? value
		: // @ts-expect-error
			isObject(value) && 'values' in value
			? /** @type {{ values(): IterableIterator<T> }} */ (
					value
				).values()
			: toArray(/** @type {Iterable<T> | ArrayLike<T>} */ (value))

/**
 * @template T
 * @param {T} value
 */
export const toEntries = value =>
	// @ts-expect-error
	isObject(value) && 'entries' in value
		? /** @type {{ entries(): IterableIterator<[string, T]> }} */ (
				value
			).entries()
		: toArray(/** @type {Iterable<T> | ArrayLike<T>} */ (value))

export const iterator = Symbol.iterator
export const Iterator = window.Iterator

export const stringify = JSON.stringify

/** @param {unknown} o */
export const stringifyReadable = o => stringify(o, null, 2)

/** @param {unknown} o */
export const stringifySorted = o => {
	function sort(o) {
		if (!isObject(o)) {
			return o
		}

		const asArray = isArray(o)
		/** @type {unknown[] | { [key: string]: unknown }} */
		const tmp = asArray ? [] : {}
		keys(o)
			.sort()
			.map(k => (tmp[k] = sort(o[k])))

		if (asArray) {
			// @ts-expect-error
			tmp.sort((a, b) => stringify(a).localeCompare(stringify(b)))
		}
		return tmp
	}
	return stringifyReadable(sort(o))
}

/**
 * @param {(
 * 	resolve: (value: unknown) => void,
 * 	reject: (reason?: any) => void,
 * ) => void} fn
 */
export const promise = fn => new Promise(fn)

export const withResolvers = () => Promise.withResolvers()

/**
 * Given a promise it adds `onDone` to `then` and `catch`
 *
 * ```js
 * resolved(promise, onDone)
 * // is same as
 * promise.then(onDone).catch(onDone)
 * ```
 */
export const resolved = (promise, onDone) =>
	promise.then(onDone).catch(onDone)

/**
 * Runs an array of functions
 *
 * @param {Iterable<Function>} fns
 */
export const call = fns => {
	for (const fn of fns) fn()
}

/**
 * Flats an array recursively and passes values to secondary function
 *
 * @template {unknown | unknown[]} T
 * @param {T} arr
 * @param {(value: T) => void} fn
 */
export const flatForEach = (arr, fn) => {
	isArray(arr)
		? arr.flat(Infinity).forEach(value => value && fn(value))
		: arr
			? fn(arr)
			: nothing
}

/**
 * Object.defineProperty with `enumerable` and `configurable` set to
 * `true` unless overwriten by `descriptor` argument
 *
 * @template T
 * @param {T} target
 * @param {PropertyKey} key
 * @param {PropertyDescriptor} descriptor
 */
export const redefineProperty = (target, key, descriptor) =>
	defineProperty(
		target,
		key,
		assign(create(redefinePropertyDefailts), descriptor),
	)

const redefinePropertyDefailts = {
	__proto__: null,
	configurable: true,
	enumerable: true,
}

/**
 * Returns an object without a prototype
 *
 * @type {Function}
 */
export const empty = Object.create.bind(null, null)

/**
 * An empty frozen array
 *
 * @type {readonly unknown[]}
 */
export const emptyArray = freeze([])

/** An empty frozen object */
export const nothing = freeze(empty())

export function* entriesIncludingSymbols(target) {
	for (const item of entries(target)) {
		yield item
	}

	for (const item of getOwnPropertySymbols(target)) {
		yield [item, target[item]]
	}
}

/**
 * Compares two values for equality. Handles primitive types, objects,
 * and arrays recursively.
 *
 * @template T
 * @param {T} a - The first value to compare.
 * @param {T} b - The second value to compare.
 * @returns {boolean} True if the values are equal, false otherwise.
 * @url modified version of https://github.com/epoberezkin/fast-deep-equal
 */
export function equals(a, b) {
	if (a === b) {
		return true
	}

	if (a && b && typeof a == 'object' && typeof b == 'object') {
		if (a.constructor !== b.constructor) {
			return false
		}

		let length, i, k
		if (isArray(a)) {
			length = a.length
			// @ts-expect-error
			if (length != b.length) {
				return false
			}
			for (i = length; i-- !== 0; ) {
				if (!equals(a[i], b[i])) {
					return false
				}
			}
			return true
		}

		if (a.constructor === RegExp)
			// @ts-expect-error
			return a.source === b.source && a.flags === b.flags
		if (a.valueOf !== Object.prototype.valueOf)
			return a.valueOf() === b.valueOf()
		if (a.toString !== Object.prototype.toString)
			return a.toString() === b.toString()

		k = keys(a)
		length = k.length
		if (length !== keys(b).length) {
			return false
		}

		for (i = length; i-- !== 0; ) {
			if (!Object.prototype.hasOwnProperty.call(b, k[i])) {
				return false
			}
		}

		for (i = length; i-- !== 0; ) {
			var key = k[i]

			if (!equals(a[key], b[key])) {
				return false
			}
		}

		return true
	}

	// true if both NaN, false otherwise
	return a !== a && b !== b
}

/**
 * Unwraps an array/childNodes to the first item if the length is 1
 *
 * @param {any[] | NodeListOf<ChildNode>} arr
 * @returns {any}
 */
export const unwrapArray = arr => (arr.length === 1 ? arr[0] : arr)

/**
 * Flats an array/childNodes recursively
 *
 * @template {unknown | unknown[]} T
 * @param {T} arr
 * @returns {T[]}
 */
export const flatToArray = arr =>
	isArray(arr) ? arr.flat(Infinity) : [arr]

/**
 * Keeps state in the function as the first param
 *
 * @template {(...args: any[]) => any} T
 * @param {T} fn - Function to which add state to it
 * @param {() => DataStore<Map<unknown, unknown>>} [state] - Passed to
 *   `fn` as first param
 * @returns {(...args: Parameters<T>) => ReturnType<T>} A copy of the
 *   function with the state
 */
export const withState = /* #__NO_SIDE_EFFECTS__ */ (
	fn,
	state = cacheStore,
) => fn.bind(null, state())

/** Memoize functions with a map cache */
export const withCache = fn =>
	withState(
		(cache, thing) => cache.get(thing, thing => fn(thing)),
		cacheStore,
	)
/** Memoize functions with a weak cache */
export const withWeakCache = fn =>
	withState(
		(cache, thing) => cache.get(thing, thing => fn(thing)),
		weakStore,
	)

export const getOwnValues = o =>
	getOwnPropertyNames(o).map(key => {
		try {
			return o[key]
		} catch (e) {}
	})

export function getSetterNamesFromPrototype(object, set = new Set()) {
	const descriptors = getOwnPropertyDescriptors(object)

	for (const key in descriptors) {
		if (descriptors[key].set) {
			set.add(key)
		}
	}

	return set
}

/**
 * Unwraps values. If the argument is a function then it runs it
 * recursively and returns the value
 *
 * @template T
 * @param {Accessor<T>} value - Maybe function
 * @returns T
 */
export function getValue(value) {
	while (typeof value === 'function')
		value = /** @type {() => T} */ (value)()
	return value
}

export const getValueWithArguments = (value, ...args) =>
	typeof value === 'function'
		? args.length
			? getValue(value(...args))
			: getValue(value())
		: value

/**
 * Identity function, given `x` returns `x`
 *
 * @template T
 * @param {T} x
 * @returns {T}
 */
export const identity = x => x

/**
 * When `value` is an object, it will check if the `key` on `target`
 * is `configurable`
 *
 * @param {object} target
 * @param {PropertyKey} key
 * @param {boolean | undefined} value
 */
export const isConfigurable = (target, key, value) => {
	if (isObject(value)) {
		const descriptor = getOwnPropertyDescriptor(target, key)
		if (descriptor) {
			return descriptor.configurable
		}
	}
	return true
}

/**
 * Returns `true` when `typeof` of `value` is `function`
 *
 * @param {unknown} value
 * @returns {value is function}
 */
export const isFunction = value => typeof value === 'function'

export const isNaN = Number.isNaN

/**
 * Returns `true` when value is Iterable
 *
 * @param {unknown} value
 * @returns {value is Iterable<unknown>}
 */
export const isIterable = value => value?.[iterator]

/**
 * Returns `true` if the value is `null` or `undefined`
 *
 * @param {unknown} value
 * @returns {value is null | undefined}
 */
export const isNullUndefined = value => value == null

/**
 * Returns `true` when typeof of value is object and not null
 *
 * @template T
 * @param {T} value
 * @returns {value is object}
 */
export const isObject = value =>
	value !== null && typeof value === 'object'

/**
 * Returns `true` when `typeof` of `value` is `string`
 *
 * @param {unknown} value
 * @returns {value is string}
 */
export const isString = value => typeof value === 'string'

/**
 * Returns `true` when `typeof` of `value` is `number`
 *
 * @param {unknown} value
 * @returns {value is number}
 */
export const isNumber = value => typeof value === 'number'

/**
 * Returns `true` when `typeof` of `value` is `symbol`
 *
 * @param {unknown} value
 * @returns {value is symbol}
 */
export const isSymbol = value => typeof value === 'symbol'

/**
 * Returns `true` when `typeof` of `value` is `boolean`
 *
 * @param {unknown} value
 * @returns {value is boolean}
 */
export const isBoolean = value => typeof value === 'boolean'

/**
 * Returns `true` when `value` may be a promise
 *
 * @param {unknown} value
 * @returns {value is Promise<unknown>}
 */
export const isPromise = value =>
	isFunction(/** @type {any} */ (value)?.then)

/**
 * @template T
 * @param {T} value
 * @returns {value is array}
 */
export const isArray = Array.isArray

/**
 * Returns `true` when object morphed between array/object
 *
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
export const morphedBetweenArrayAndObject = (a, b) =>
	(isObject(a) && !isObject(b)) ||
	(isObject(b) && !isObject(a)) ||
	(isArray(a) && !isArray(b)) ||
	(isArray(b) && !isArray(a))

/**
 * Returns `true` if the property is defined in the `prototype` and
 * absent in the `object`
 *
 * @param {object} target
 * @param {PropertyKey} key
 */
export const isPrototypeProperty = (target, key) =>
	// must do `key in target` to check that it DOES have it somewhere
	// must do !hasOwnProperty to check that isnt an own property
	key in target && !hasOwn(target, key)

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/GeneratorFunction
const GeneratorFunction = function* () {}.constructor

/** Returns `true` when is a generator function */
export const isGeneratorFunction = target =>
	target &&
	(target.constructor === GeneratorFunction ||
		target.constructor?.constructor === GeneratorFunction)

export const noop = () => {}

// an optional value is `true` by default, so most of the time is undefined which means is `true`
// to avoid having conditions like `if(something.bla === undefined || something.bla)`
// this function will short it to `if(optional(something.bla))`
// additionally the value is resolved, for cases like `when={() => show() && optional(props.when)}`

/**
 * Returns `true` when value is `true` or `undefined`
 *
 * @template T
 * @param {T} value
 * @returns {true | T} True when value is true or undefined
 */
export const optional = value =>
	value === undefined || getValue(value)

export function* range(start, stop, step) {
	if (step < 0) step = Math.abs(step)
	yield start
	if (start < stop) {
		while (start < stop) {
			yield (start += step)
		}
	} else {
		while (start > stop) {
			yield (start -= step)
		}
	}
}

export const {
	ownKeys: reflectOwnKeys,
	has: reflectHas,
	deleteProperty: reflectDeleteProperty,
	getOwnPropertyDescriptor: reflectGetOwnPropertyDescriptor,
	get: reflectGet,
	apply: reflectApply,
	set: reflectSet,
	isExtensible: reflectIsExtensible,
} = Reflect

/**
 * Removes a value from an array
 *
 * @template T
 * @param {T[]} array
 * @param {T} value To remove from the array
 */
export function removeFromArray(array, value) {
	const index = array.indexOf(value)
	if (index !== -1) array.splice(index, 1)
}
/**
 * Removes values from an array based on a condition
 *
 * @template T
 * @param {T[]} array
 * @param {(index: number, value: T) => boolean} cb Function with
 *   condition
 */
export function removeFromArrayConditionally(array, cb) {
	let i = array.length
	while (i--) {
		if (cb(i, array[i])) {
			array.splice(i, 1)
		}
	}
}
/**
 * Removes values from an array based on a condition
 *
 * @template T
 * @param {Iterable<T>} iterable
 * @param {PropertyKey} key Function with condition
 */
export function indexByKey(iterable, key) {
	const byKey = empty()
	for (const item of iterable) {
		byKey[item[key]] = item
	}
	return byKey
}

export const typeString = obj =>
	Object.prototype.toString.call(obj).slice(8, -1)

export function walkParents(context, propertyName, cb) {
	while (context) {
		if (cb(context)) return true
		context = context[propertyName]
	}
	return false
}

/** @template {Map<any, any> | WeakMap<any, any>} T */
class DataStore {
	/** @param {new () => T} kind */
	constructor(kind) {
		const store = new kind()

		const get = store.get.bind(store)
		const set = store.set.bind(store)
		const has = store.has.bind(store)
		const del = store.delete.bind(store)

		this.set = set
		this.has = has
		this.delete = del

		this.get = (target, defaults = null) => {
			const o = get(target)

			if (defaults !== null && o === undefined) {
				/**
				 * Default values should be passed as a function, so we dont
				 * constantly initialize values when giving them
				 */
				defaults = defaults(target)
				set(target, defaults)
				return defaults
			}
			return o
		}
	}

	*[Symbol.iterator]() {
		yield this.get
		yield this.set
		yield this.has
		yield this.delete
	}
}

export const weakStore = () => new DataStore(WeakMap)
export const cacheStore = () => new DataStore(Map)

export const warn = (...args) => console.warn(...args)
export const error = (...args) => console.error(...args)

/**
 * 1. A non-extensible object must return the real object, but still its
 *    children properties could be tracked/proxied
 * 2. A non-configurable property must return the real value
 *
 * [[Get]] For proxy objects enforces the following invariants:
 *
 * - The value reported for a property must be the same as the value of
 *   the corresponding target object property if the target object
 *   property is a non-writable, non-configurable own data property.
 * - The value reported for a property must be undefined if the
 *   corresponding target object property is a non-configurable own
 *   accessor property that has undefined as its [[Get]] attribute.
 */
export const isProxyValueReturnInvariant = (target, key, value) =>
	!isObject(value) ||
	!reflectIsExtensible(target) ||
	reflectGetOwnPropertyDescriptor(target, key)?.configurable === false
