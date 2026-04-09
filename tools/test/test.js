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
} from 'pota/use/test'

// test wrapper — clears body, tracks results for run()

/**
 * @type {Promise<{
 * 	title: string
 * 	ok: boolean
 * 	error?: string
 * }>[]}
 */
const results = []

/**
 * Extracts a readable message from a test rejection value.
 *
 * @param {unknown} e
 */
function formatError(e) {
	if (e.message) return e.message
	if (e.expected !== undefined)
		return (
			'expected ' +
			JSON.stringify(e.expected) +
			' but got ' +
			JSON.stringify(e.value)
		)
	return String(e)
}

/**
 * Wraps a test: clears the body, delegates to pota/use/test, tracks
 * the result.
 *
 * @type {typeof testImpl}
 */
export function test(title, fn) {
	const tracked = testImpl(title, fn).then(
		() => ({ title, ok: true }),
		e => ({ title, ok: false, error: formatError(e) }),
	)

	results.push(tracked)
	return tracked
}

// run — called by the HTML harness after the test module loads

/**
 * Awaits all tracked tests and exposes results on
 * window.**pota_results**.
 */
export async function run() {
	const out = { passed: 0, failed: 0, errors: [] }

	for (const r of await Promise.all(results)) {
		if (r.ok) {
			out.passed++
		} else {
			out.failed++
			out.errors.push({ title: r.title, error: r.error })
		}
	}

	out.done = true
	window.__pota_results__ = out
}
