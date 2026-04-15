import { stringifySorted, window, withResolvers } from '../lib/std.js'

import { untrack } from '../lib/reactive.js'

import { diff } from './string.js'
import { addAdoptedStyleSheet, css } from './css.js'

/** @type {boolean | undefined} */
let stop = undefined
let num = 1

/**
 * A simple test function that mimics the behavior of testing
 * frameworks. It takes a title, a test function, and an optional flag
 * to stop testing after this test. The test function receives an
 * `expect` function to make assertions.
 *
 * @param {string} title - The title of the test case.
 * @param {(
 * 	expect: (arg: unknown) => Expect,
 * ) => void | Promise<unknown>} fn
 *   - The test function containing assertions.
 *
 * @param {boolean} [stopTesting] - If true, no more tests will be run
 *   after this one.
 * @returns {Promise<unknown>} A promise that resolves when all
 *   assertions in the test pass, or rejects if any assertion fails.
 */
export function test(title, fn, stopTesting) {
	if (!stop) {
		stop = stop || stopTesting
		title = num++ + ' - ' + title
		console.log(title)
		/** @type Promise<unknown>[] */
		const promises = []

		try {
			const result = fn(
				expect.bind(null, title, { value: 1 }, promises),
			)
			if (result && result.then) promises.push(result)
		} catch (e) {
			error(title, e)
		}

		return Promise.all(promises)
	} else {
		return Promise.resolve()
	}
}

test.reset = () => {
	num = 1
}

/**
 * Simple expect-like function
 *
 * @param {string} title
 * @param {{ value: number }} num
 * @param {Promise<unknown>[]} promises
 * @param {unknown} value
 * @returns {Expect}
 */
function expect(title, num, promises, value) {
	const test = {
		toBe: expected =>
			pass(
				expected,
				value,
				true,
				title + ' (' + num.value++ + ')',
				promises,
			),
		toEqual: expected =>
			untrack(() =>
				pass(
					stringifySorted(expected),
					stringifySorted(value),
					true,
					title + ' (' + num.value++ + ')',
					promises,
				),
			),
		toInclude: expected =>
			untrack(() =>
				pass(
					true,
					(/** @type {string | any[]} */ (value))?.includes(
						expected,
					),
					true,
					title + ' (' + num.value++ + ')',
					promises,
				),
			),
		toThrow: () =>
			untrack(() => {
				let threw = true
				try {
					;(/** @type {Function} */ (value))()
					threw = false
				} catch {}
				return pass(
					true,
					threw,
					true,
					title + ' (' + num.value++ + ')',
					promises,
				)
			}),
		toMatch: expected =>
			pass(
				true,
				(/** @type {RegExp} */ (expected)).test(
					/** @type {string} */ (value),
				),
				true,
				title + ' (' + num.value++ + ')',
				promises,
			),
		not: {
			toBe: expected =>
				pass(
					expected,
					value,
					false,
					title + ' (' + num.value++ + ')',
					promises,
				),
			toEqual: expected =>
				untrack(() =>
					pass(
						stringifySorted(expected),
						stringifySorted(value),
						false,
						title + ' (' + num.value++ + ')',
						promises,
					),
				),
			toInclude: expected =>
				untrack(() =>
					pass(
						true,
						(/** @type {string | any[]} */ (value))?.includes(
							expected,
						),
						false,
						title + ' (' + num.value++ + ')',
						promises,
					),
				),
			toThrow: () =>
				untrack(() => {
					let threw = true
					try {
						;(/** @type {Function} */ (value))()
						threw = false
					} catch {}
					return pass(
						true,
						threw,
						false,
						title + ' (' + num.value++ + ')',
						promises,
					)
				}),
			toMatch: expected =>
				pass(
					true,
					(/** @type {RegExp} */ (expected)).test(
						/** @type {string} */ (value),
					),
					false,
					title + ' (' + num.value++ + ')',
					promises,
				),
		},
	}

	return test
}

/**
 * Validates if a test assertion passes or fails
 *
 * @param {unknown} expected - Expected value
 * @param {unknown} value - Actual value
 * @param {boolean} equals - Whether values should be equal
 * @param {string} title - Test title
 * @param {Promise<unknown>[]} promises - Array to collect test
 *   promises
 * @returns {Promise<unknown>} Promise that resolves/rejects based on
 *   assertion result
 */
function pass(expected, value, equals, title, promises) {
	const { promise, resolve, reject } = withResolvers()
	promises.push(promise)
	if (expected !== value && equals) {
		const [expectedPrt, valuePrt] = diff(expected, value)
		error(
			title,
			' expected `',
			expectedPrt,
			'`' + (expectedPrt === '' ? '(empty)' : '') + ' got `',
			valuePrt,
			'`' + (valuePrt === '' ? '(empty)' : ''),
		)
		reject({ title, expected, value })
	} else if (expected === value && !equals) {
		error(title, ' expected to be different `', value, '`')
		reject({ title, expected, value })
	} else {
		resolve({ title, expected, value })
	}

	return promise
}

/**
 * Logs an error message with test title in red color
 *
 * @param {string} title - The test title
 * @param {...unknown} args - Additional arguments to log
 */
function error(title, ...args) {
	console.error('\x1b[31m' + title + '\n\x1b[0m', ...args)
}

// isProxy

const proxies = new WeakSet()

window.Proxy = new Proxy(Proxy, {
	construct(target, args) {
		const proxy = Reflect.construct(target, args)
		proxies.add(proxy)
		return proxy
	},
})

/**
 * Returns true if value is a proxy. This is defined for
 * debugging/testing purposes.
 *
 * @param {unknown} value
 */
export const isProxy = value =>
	proxies.has(/** @type {object} */ (value))

/**
 * Injects a temporary stylesheet that highlights DOM nodes whenever
 * they rerender.
 */
export const rerenders = () =>
	addAdoptedStyleSheet(
		document,
		css`
			* {
				animation-duration: 1s;
				animation-name: render;
			}
			@keyframes render {
				from {
					background: rgba(88, 166, 255, 0.5);
				}
				to {
					background: transparent;
				}
			}
		`,
	)

/** Returns `document.body.innerHTML` trimmed. */
export const body = () => document.body.innerHTML.trim()

/** Returns `document.head.innerHTML` trimmed. */
export const head = () => document.head.innerHTML.trim()

/**
 * Returns the number of child nodes of a given node, defaulting to
 * `document.body`.
 *
 * @param {Node} [node] - The parent node to inspect.
 * @returns {number} The child node count.
 */
export const childNodes = (node = document.body) =>
	node.childNodes.length

/**
 * Waits one microtask (`Promise.resolve()`).
 *
 * @returns {Promise<void>}
 */
export const microtask = () => Promise.resolve()

/**
 * Waits one macrotask (`setTimeout(0)`).
 *
 * @returns {Promise<void>}
 */
export const macrotask = () =>
	new Promise(resolve => setTimeout(resolve, 0))

/**
 * Waits for the given number of milliseconds.
 *
 * @param {number} [ms] - Delay in milliseconds (defaults to 0).
 * @returns {Promise<void>}
 */
export const sleep = (ms = 0) =>
	new Promise(resolve => setTimeout(resolve, ms))

/**
 * Centralized "long" sleep for router/location tests that need to
 * wait longer than a macrotask — e.g. `history.back()`, delayed
 * navigation, `Navigate` with `replace`, `useBeforeLeave`. Tuning
 * this single constant is enough to retime every flaky wait.
 *
 * @returns {Promise<void>}
 */
export const sleepLong = () => sleep(300)

/**
 * Walks past descendant/combinator boundaries (` `, `>`, `+`, `~`, `,`)
 * to the final compound selector — e.g. `'div input[name="x"]'`
 * → `'input[name="x"]'`, `'a, b > c'` → `'c'`.
 *
 * @template {string} S
 * @typedef {S extends `${string} ${infer R}`
 * 	? LastCompound<R>
 * 	: S extends `${string}>${infer R}`
 * 		? LastCompound<R>
 * 		: S extends `${string}+${infer R}`
 * 			? LastCompound<R>
 * 			: S extends `${string}~${infer R}`
 * 				? LastCompound<R>
 * 				: S extends `${string},${infer R}`
 * 					? LastCompound<R>
 * 					: S} LastCompound
 */

/**
 * Extracts the tag portion of a compound selector — everything before
 * the first `[`, `.`, `#`, or `:`. `'input[name="x"]'` → `'input'`,
 * `'button.primary'` → `'button'`, `'input'` → `'input'`.
 *
 * @template {string} S
 * @typedef {S extends `${infer T}[${string}`
 * 	? T
 * 	: S extends `${infer T}.${string}`
 * 		? T
 * 		: S extends `${infer T}#${string}`
 * 			? T
 * 			: S extends `${infer T}:${string}`
 * 				? T
 * 				: S} CompoundTag
 */

/**
 * Walks the selector to its last compound, then extracts the tag.
 * For `'div input[name="x"]'` this resolves to `'input'`; for
 * `'.foo'` it resolves to `'.foo'` (no tag).
 *
 * @template {string} S
 * @typedef {CompoundTag<LastCompound<S>>} SelectorTag
 */

/**
 * Resolves a CSS selector string to its element type, extracting the
 * leading tag. Falls back to `HTMLElement` when the prefix is not a
 * known tag name (e.g. class/id-only selectors).
 *
 * @template {string} S
 * @typedef {SelectorTag<S> extends keyof HTMLElementTagNameMap
 * 	? HTMLElementTagNameMap[SelectorTag<S>]
 * 	: SelectorTag<S> extends keyof SVGElementTagNameMap
 * 		? SVGElementTagNameMap[SelectorTag<S>]
 * 		: SelectorTag<S> extends keyof MathMLElementTagNameMap
 * 			? MathMLElementTagNameMap[SelectorTag<S>]
 * 			: HTMLElement} SelectorElement
 */

/**
 * Shorthand for `document.querySelector`. Infers the element type from
 * the selector's leading tag, so `$('input')`, `$('input[name="x"]')`,
 * and `$('input.foo')` all return `HTMLInputElement | null`. Pass an
 * explicit element type as a type parameter to override:
 * `$<HTMLDivElement>('.my-class')`.
 *
 * @type {{
 * 	<S extends string>(
 * 		selector: S,
 * 		node?: Document | HTMLElement,
 * 	): SelectorElement<S> | null
 * 	<E extends Element = HTMLElement>(
 * 		selector: string,
 * 		node?: Document | HTMLElement,
 * 	): E | null
 * }}
 */
export const $ = (selector, node) =>
	(node || document).querySelector(selector)

/**
 * Shorthand for `document.querySelectorAll`, spread into an array so
 * callers get `Array` methods (`map`, `filter`, etc.). Infers the
 * element type from the selector's leading tag (see `$`).
 *
 * @type {{
 * 	<S extends string>(
 * 		selector: S,
 * 		node?: Document | HTMLElement,
 * 	): SelectorElement<S>[]
 * 	<E extends Element = HTMLElement>(
 * 		selector: string,
 * 		node?: Document | HTMLElement,
 * 	): E[]
 * }}
 */
export const $$ = (selector, node) => [
	...(node || document).querySelectorAll(selector),
]
