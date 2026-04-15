// Browser-side test harness
// Wraps pota/use/test, collects results for the runner

import { test as testImpl } from 'pota/use/test'

// re-export helpers from pota/use/test
export {
	$,
	$$,
	body,
	childNodes,
	head,
	macrotask,
	microtask,
	sleep,
	sleepLong,
} from 'pota/use/test'

// test wrapper — clears body/head, tracks results for run()

/**
 * @typedef {{
 * 	__error: true
 * 	message?: string
 * 	stack?: string
 * 	cause?: unknown
 * }} PackedError
 */

/**
 * @typedef {{
 * 	passed: number
 * 	failed: number
 * 	errors: { title: string; error: unknown }[]
 * 	done?: boolean
 * }} TestResults
 */

/**
 * @type {Promise<{
 * 	title: string
 * 	ok: boolean
 * 	error?: unknown
 * }>[]}
 */
const results = []

/**
 * Converts an error to a plain serializable object.
 *
 * @param {unknown} e
 * @returns {unknown}
 */
function packError(e) {
	if (typeof e === 'object' && e !== null) {
		const err = /** @type {{ message?: string; stack?: string; cause?: unknown }} */ (
			e
		)
		if (err.stack || err.message) {
			/** @type {PackedError} */
			const o = {
				__error: true,
				message: err.message,
				stack: err.stack,
			}
			if (err.cause) o.cause = packError(err.cause)
			return o
		}
		return e
	}
	return e
}

/**
 * Wraps a test: clears body and head before, asserts they are clean
 * after, delegates to pota/use/test, tracks the result.
 *
 * @type {typeof testImpl}
 */
export function test(title, fn) {
	// clean slate before each test
	document.body.innerHTML = ''
	document.head.innerHTML = ''
	document.adoptedStyleSheets = []

	const tracked = testImpl(title, fn)
		.then(
			() => {
				// verify body is clean
				const bodyLeftover = document.body.innerHTML.trim()
				if (bodyLeftover) {
					return {
						title,
						ok: false,
						error:
							'body not empty after test: ' +
							bodyLeftover.slice(0, 200),
					}
				}
				// verify head is clean
				// Chrome injects <title></title> on popstate/back navigation
				const headLeftover = document.head.innerHTML.trim()
				if (
					headLeftover !== '' &&
					headLeftover !== '<title></title>'
				) {
					return {
						title,
						ok: false,
						error:
							'head not clean after test: ' +
							headLeftover.slice(0, 200),
					}
				}
				// verify no adopted stylesheets leaked
				if (document.adoptedStyleSheets.length > 0) {
					return {
						title,
						ok: false,
						error:
							'test left ' +
							document.adoptedStyleSheets.length +
							' adopted stylesheet(s) on document',
					}
				}
				return { title, ok: true }
			},
			e => ({ title, ok: false, error: packError(e) }),
		)
		.catch(e => ({ title, ok: false, error: packError(e) }))

	results.push(tracked)
	return tracked
}

// run — called by the HTML harness after the test module loads

/**
 * Awaits all tracked tests and exposes results on
 * window.**pota_results**.
 */
export async function run() {
	const out = /** @type {{ __pota_results__: TestResults }} */ (
		/** @type {unknown} */ (window)
	).__pota_results__

	for (const r of await Promise.all(results)) {
		if (r.ok) {
			out.passed++
		} else {
			out.failed++
			out.errors.push({ title: r.title, error: r.error })
		}
	}

	out.done = true
}
