export const global = globalThis
export const window = global

export const CSSStyleSheet = global.CSSStyleSheet
export const document = global.document
export const DocumentFragment = global.DocumentFragment
export const Object = global.Object
export const Promise = global.Promise
export const requestAnimationFrame = global.requestAnimationFrame
export const Symbol = global.Symbol
export const queueMicrotask = global.queueMicrotask

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
export const hasOwnProperty = Object.hasOwn
export const is = Object.is
export const isExtensible = Object.isExtensible
export const keys = Object.keys
export const values = Object.values
export const setPrototypeOf = Object.setPrototypeOf

export const isArray = Array.isArray
export const toArray = Array.from

export const isNaN = Number.isNaN

export const iterator = Symbol.iterator

export const stringify = JSON.stringify
export const stringifyReadable = o => stringify(o, null, 2)

export const stringifySorted = o => {
	function sort(o) {
		if (!isObject(o)) {
			return o
		}
		const tmp = isArray(o) ? [] : {}
		keys(o)
			.sort()
			.map(k => (tmp[k] = sort(o[k])))

		if (isArray(tmp)) {
			tmp.sort((a, b) => stringify(a).localeCompare(stringify(b)))
		}
		return tmp
	}
	return stringifyReadable(sort(o))
}

export const PrototypeArray = Array.prototype
export const PrototypeMap = Map.prototype

export const history = global.history
export const location = global.location
export const navigator = global.navigator

export const origin = location?.origin

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

export const setAttribute = (node, name, value) =>
	node.setAttribute(name, value)

export const hasAttribute = (node, name) => node.hasAttribute(name)

export const removeAttribute = (node, name) =>
	node.removeAttribute(name)

export const setAttributeNS = (node, name, value) =>
	node.setAttributeNS(name, value)

export const hasAttributeNS = (node, name) =>
	node.hasAttributeNS(name)

export const removeAttributeNS = (node, name) =>
	node.removeAttributeNS(name)

export const isConnected = node => node.isConnected

export const activeElement = () => document.activeElement

export const documentElement = document?.documentElement

/**
 * Runs an array of functions
 *
 * @param {Iterable<Function>} fns
 */
export const call = fns => {
	for (const fn of fns) fn()
}

export function copy(o) {
	const seen = new Map()
	function copy(o) {
		if (!isObject(o)) {
			return o
		}

		if (
			o instanceof Node ||
			o instanceof Date ||
			o instanceof Set ||
			o instanceof Map ||
			o instanceof WeakSet ||
			o instanceof WeakMap ||
			o instanceof Promise ||
			o instanceof RegExp
		) {
			return o
		}

		if (seen.has(o)) {
			return seen.get(o)
		}

		const c = isArray(o) ? [] : {}

		seen.set(o, c)

		for (const k in o) {
			c[k] = copy(o[k])
		}
		return c
	}
	return copy(o)
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
	defineProperty(target, key, assign(create(defaults), descriptor))

const defaults = {
	__proto__: null,
	configurable: true,
	enumerable: true,
}

/**
 * Object.defineProperty with `configurable`, `writable` and
 * `enumerable` as `false`
 *
 * @template T
 * @param {T} target
 * @param {PropertyKey} key
 * @param {any} value
 */
export const definePropertyReadOnly = (target, key, value) => {
	const descriptor = create(defaultsReadOnly)
	descriptor.value = value
	defineProperty(target, key, descriptor)
}

const defaultsReadOnly = {
	__proto__: null,
	configurable: false,
	enumerable: false,
	writable: false,
	value: undefined,
}

const bind = /* #__NO_SIDE_EFFECTS__ */ fn =>
	document && document[fn].bind(document)

export const createElement = bind('createElement')
export const createElementNS = bind('createElementNS')
export const createTextNode = bind('createTextNode')
export const createComment = bind('createComment')

export const importNode = bind('importNode')

export const createTreeWalker = bind('createTreeWalker')

/**
 * Returns an object without a prototype
 *
 * @type {Function}
 * @returns {Props} Empty object
 */
export const empty = Object.create.bind(null, null)

/**
 * An empty frozen array
 *
 * @type {readonly []}
 */
export const emptyArray = freeze([])

/**
 * An empty frozen object
 *
 * @type object
 */
export const nothing = freeze(empty())

export function* entriesIncludingSymbols(target) {
	for (const item of entries(target)) {
		yield item
	}

	for (const item of getOwnPropertySymbols(target)) {
		// todo: causes access!
		yield [item, target[item]]
	}
}

// modified version of https://github.com/epoberezkin/fast-deep-equal

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
 * Flats an array/childNodes to the first children if the length is 1
 *
 * @param {any[] | NodeListOf<ChildNode>} arr
 * @returns {any}
 */
export const flat = arr => (arr.length === 1 ? arr[0] : arr)

/**
 * Keeps state in the function as the first param
 *
 * @template T
 * @param {T} fn - Function to which add state to it
 * @param {DataStore<Map> | DataStore<WeakMap>} [state] - Passed to
 *   `fn` as first param
 * @returns {T} A copy of the function with the state
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

export const walkElements = function (
	walk,
	node,
	max = Infinity,
	nodes = [],
) {
	/**
	 * The first node is not walked by the walker.
	 *
	 * Also the first node could be a DocumentFragment
	 */
	node.nodeType === 1 && nodes.push(node)

	walk.currentNode = node

	while (nodes.length !== max && (node = walk.nextNode())) {
		nodes.push(node)
	}
	return nodes
}.bind(
	null,
	createTreeWalker &&
		createTreeWalker(document, 1 /*NodeFilter.SHOW_ELEMENT*/),
)

/**
 * Returns `document` for element. That could be a `shadowRoot`
 *
 * @param {Element} node
 * @returns {Document | ShadowRoot}
 */

export const getDocumentForElement = node => {
	const document = node.getRootNode()
	const { nodeType } = document
	// getRootNode returns:
	// 1. Node for isConnected = false
	// 2. Document for isConnected = true
	// 3. shadowRoot for custom elements

	// always return a Document-like
	return nodeType === 11 || nodeType === 9
		? document
		: node.ownerDocument
}

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
 * @param {Function | any} value - Maybe function
 * @returns {any}
 */
export function getValue(value) {
	while (typeof value === 'function') value = value()
	return value
}

/**
 * Unwraps `value` and returns `element` if result is a `Node`, else
 * `undefined` in the case isn't a `Node`
 *
 * @param {Function | any} value - Maybe function
 * @param {...any} args? - Arguments
 * @returns {Node | undefined}
 */
export function getValueElement(value, ...args) {
	const element = getValueWithArguments(value, ...args)
	return element instanceof Node ? element : undefined
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
 * @param {any} value
 * @returns {boolean}
 */
export const isFunction = value => typeof value === 'function'

/**
 * Returns `true` when value is Iterable
 *
 * @param {any} value
 * @returns {boolean}
 */
export const isIterable = value => value?.[Symbol.iterator]

/**
 * Returns `true` if the value is `null` or `undefined`
 *
 * @param {any} value
 * @returns {boolean}
 */
export const isNullUndefined = value =>
	value === undefined || value === null

/**
 * Returns `true` when typeof of value is object and not null
 *
 * @param {any} value
 * @returns {boolean}
 */
export const isObject = value =>
	value !== null && typeof value === 'object'

/**
 * Returns `true` when object morphed between array/object
 *
 * @param {any} a
 * @param {any} b
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
	key in target && !hasOwnProperty(target, key)

/**
 * Returns `true` when `typeof` of `value` is `string`
 *
 * @param {any} value
 * @returns {boolean}
 */
export const isString = value => typeof value === 'string'

/**
 * Returns `true` when `typeof` of `value` is `number`
 *
 * @param {any} value
 * @returns {boolean}
 */
export const isNumber = value => typeof value === 'number'

/**
 * Returns `true` when `typeof` of `value` is `symbol`
 *
 * @param {any} value
 * @returns {boolean}
 */
export const isSymbol = value => typeof value === 'symbol'

/**
 * Returns `true` when `typeof` of `value` is `boolean`
 *
 * @param {any} value
 * @returns {boolean}
 */
export const isBoolean = value => typeof value === 'boolean'

/**
 * Returns `true` when `value` may be a promise
 *
 * @param {any} value
 * @returns {boolean}
 */
export const isPromise = value => isFunction(value?.then)

export const noop = () => {}

// an optional value is `true` by default, so most of the time is undefined which means is `true`
// to avoid having conditions like `if(something.bla === undefined || something.bla)`
// this function will short it to `if(optional(something.bla))`
// additionally the value is resolved, for cases like `when={() => show() && optional(props.when)}`

/**
 * Returns `true` when value is true or undefined
 *
 * @param {Function | boolean | undefined} value
 * @returns {boolean} True when value is true or undefined
 */
export const optional = value =>
	value === undefined || getValue(value)

export const partAdd = (node, className) => node.part.add(className)

export const partRemove = (node, className) =>
	node.part.remove(className)

export const querySelector = (node, query) =>
	node.querySelector(query)

export const querySelectorAll = (node, query) =>
	node.querySelectorAll(query)

export function* range(start, stop, step = 1) {
	yield start
	while (start < stop) {
		yield (start += step)
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
 * @param {(value: T, index: number) => boolean} cb Function with
 *   condition
 */
export function removeFromArrayConditionally(array, cb) {
	let i = array.length
	while (i--) {
		if (cb(array[i], i)) {
			array.splice(i, 1)
		}
	}
}
/**
 * Removes values from an array based on a condition
 *
 * @param {Iterable<object | any[]>} iterable
 * @param {PropertyKey} key Function with condition
 */
export function indexByKey(iterable, key) {
	const byKey = empty()
	for (const item of iterable) {
		byKey[item[key]] = item
	}
	return byKey
}

/**
 * Replace a prototype in the prototype chain with another prototype
 *
 * @param {object} target - Target object
 * @param {object} search - The prototype to replace
 * @param {object} replacement - The replacement prototype
 */
export function replacePrototypeWith(target, search, replacement) {
	let prototype = target
	while (getPrototypeOf(prototype) !== search) {
		prototype = getPrototypeOf(prototype)
	}

	setPrototypeOf(prototype, replacement)
}

export const typeString = obj =>
	Object.prototype.toString.call(obj).slice(8, -1)

export function walkParents(context, propertyName, cb) {
	while (context) {
		if (cb(context)) return true
		context = context[propertyName]
	}
}

class DataStore {
	/** @param {WeakMap | Map} kind */
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

/**
 * Store template
 *
 * @typedef {(
 * 	reference: any,
 * 	createIfNotExistsAs?: ((target: any) => any) | Function,
 * ) => any} DataStoreGet
 *
 *
 * @typedef {(key: any, value: any) => void} DataStoreSet
 *
 * @typedef {(key: any) => boolean} DataStoreHas
 *
 * @typedef {(key: any) => boolean} DataStoreDelete
 *
 * @typedef {[
 * 	DataStoreGet,
 * 	DataStoreSet,
 * 	DataStoreHas,
 * 	DataStoreDelete,
 * ] & {
 * 	get: DataStoreGet
 * 	set: DataStoreSet
 * 	has: DataStoreHas
 * 	delete: DataStoreDelete
 * }} DataStoreT
 */

/**
 * Creates a WeakMap to store data
 *
 * @returns {DataStoreT}
 */
export const weakStore = () => new DataStore(WeakMap)

/**
 * Creates a Map to store data
 *
 * @returns {DataStoreT}
 */
export const cacheStore = () => new DataStore(Map)

export const classListAdd = (node, className) =>
	node.classList.add(className)

export const classListRemove = (node, className) =>
	node.classList.remove(className)

/**
 * - Returns `adoptedStyleSheets` for a document
 *
 * @param {Document | ShadowRoot} document
 */
export const adoptedStyleSheetsGet = document =>
	document.adoptedStyleSheets

export const adoptedStyleSheets =
	/* #__PURE__*/ adoptedStyleSheetsGet(document)

/**
 * Adds a style sheet to the document
 *
 * @param {Document | ShadowRoot} document
 * @param {CSSStyleSheet} styleSheet
 */
export const adoptedStyleSheetsAdd = (document, styleSheet) =>
	adoptedStyleSheetsGet(document).push(styleSheet)

/**
 * Removes a style sheet from the document
 *
 * @param {Document | ShadowRoot} document
 * @param {CSSStyleSheet} styleSheet
 */
export const adoptedStyleSheetsRemove = (document, styleSheet) =>
	removeFromArray(adoptedStyleSheetsGet(document), styleSheet)

/**
 * Adds a style sheet to the custom element
 *
 * @param {Document | ShadowRoot} document
 * @param {(CSSStyleSheet | string)[]} styleSheets
 */
export function addStyleSheets(document, styleSheets = []) {
	for (const sheet of styleSheets) {
		if (sheet) {
			sheet instanceof CSSStyleSheet
				? adoptedStyleSheetsAdd(document, sheet)
				: addStyleSheetExternal(document, sheet)
		}
	}
}

/**
 * Adds the stylesheet from urls. It uses a cache, to avoid having to
 * fire a request for each external sheet when used in more than one
 * custom element. Also, all reference the same object.
 *
 * @param {Document | ShadowRoot} document
 * @param {string} text
 */
export const addStyleSheetExternal = withState(
	(state, document, text) => {
		state
			.get(text, text =>
				text.startsWith('http')
					? fetch(text)
							.then(r => r.text())
							.then(css => sheet(css))
					: promise(resolve => resolve(sheet(text))),
			)
			.then(styleSheet => adoptedStyleSheetsAdd(document, styleSheet))
	},
)

/**
 * Swaps classNames and waits for the animation to end
 *
 * @param {Element} element
 * @param {string} oldClass - `class` with the old animation
 * @param {string} newClass - `class` with the new animation
 */
export const animateClassTo = (element, oldClass, newClass) =>
	promise(resolve =>
		requestAnimationFrame(() => {
			classListRemove(element, oldClass)
			classListAdd(element, newClass)
			element.getAnimations().length
				? resolved(waitEvent(element, 'animationend'), resolve)
				: resolve()
		}),
	)

/**
 * Swaps parts and waits for the animation to end
 *
 * @param {Element} element
 * @param {string} oldPart - `part` with the old animation
 * @param {string} newPart - `part` with the new animation
 */
export const animatePartTo = (element, oldPart, newPart) =>
	promise(resolve =>
		requestAnimationFrame(() => {
			partRemove(element, oldPart)
			partAdd(element, newPart)
			element.getAnimations().length
				? resolved(waitEvent(element, 'animationend'), resolve)
				: resolve()
		}),
	)

/**
 * Creates tagged css and returns a CSSStyleSheet. Mostly for css
 * highlighting in js
 *
 * @param {TemplateStringsArray} template
 * @param {...any} values
 * @returns {CSSStyleSheet}
 */
export const css = (template, ...values) =>
	sheet(String.raw({ raw: template }, ...values))

/**
 * Creates a stylesheet from a css string
 *
 * @param {string} css
 * @returns {CSSStyleSheet}
 */
export const sheet = withCache(css => {
	const sheet = new CSSStyleSheet()
	/**
	 * Replace is asynchronous and can accept @import statements
	 * referencing external resources.
	 */
	sheet.replace(css)

	return sheet
})

/**
 * @param {Element} node
 * @param {string} eventName
 * @param {any} [data]
 */

export const emit = (
	node,
	eventName,
	data = { bubbles: true, cancelable: true, composed: true },
) => node.dispatchEvent(new CustomEvent(eventName, data))

export function stopEvent(e) {
	preventDefault(e)
	stopPropagation(e)
	stopImmediatePropagation(e)
}

export const preventDefault = e => e.preventDefault()
export const stopPropagation = e => e.stopPropagation()
export const stopImmediatePropagation = e =>
	e.stopImmediatePropagation()

/**
 * Waits for an event to be dispatched and runs a callback
 *
 * @param {Element} element
 * @param {string} eventName
 */
export const waitEvent = withState(
	(state, element, eventName) =>
		promise((resolve, reject) => {
			/**
			 * To prevent firing `transitionend` twice it needs to stop
			 * listening the old one because maybe wasn't dispatched and
			 * running a new transition will make it dispatch twice
			 */
			const previous = state.get(element, empty)
			previous.reject && previous.reject()
			element.removeEventListener(eventName, previous.resolve)
			state.set(element, { resolve, reject })
			element.addEventListener(eventName, resolve, {
				once: true,
			})
		}),
	weakStore,
)

export const addEventNative = (where, type, handler) =>
	where.addEventListener(type, handler, handler)

export const removeEventNative = (where, type, handler) =>
	where.removeEventListener(type, handler, handler)

/** @param {EventListener} fn */
export const passiveEvent = fn => ({ handleEvent: fn, passive: true })

export const warn = (...args) => console.warn(...args)
export const error = (...args) => console.error(...args)
