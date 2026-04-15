// Test result reporting — formatting and console output

import { red, green, yellow, dim, white } from '../utils.js'

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
 * 	__event: string
 * 	error?: unknown
 * 	reason?: unknown
 * 	filename?: string
 * 	lineno?: number
 * }} PackedEvent
 */

/**
 * @typedef {{
 * 	title?: string
 * 	__event?: string
 * 	error?: unknown
 * 	reason?: unknown
 * }} ErrorEntry
 */

/**
 * @typedef {{
 * 	passed: number
 * 	failed: number
 * 	errors: ErrorEntry[]
 * 	console?: { type: 'log' | 'warn' | 'error'; args: unknown[] }[]
 * 	done?: boolean
 * }} TestResults
 */

/**
 * Unpacks a browser value: error markers become their stack,
 * everything else passes through for Node's console to format.
 *
 * @param {unknown} arg
 * @returns {unknown}
 */
function unpack(arg) {
	if (
		typeof arg === 'object' &&
		arg !== null &&
		'__error' in arg
	) {
		const e = /** @type {PackedError} */ (arg)
		let s = e.stack || e.message || ''
		if (e.cause) s += '\nCaused by: ' + unpack(e.cause)
		return s
	}
	return arg
}

const consoleTypes = {
	log: { fn: console.log, label: dim('log') },
	warn: { fn: console.warn, label: yellow('warn') },
	error: { fn: console.error, label: red('error') },
}

/**
 * Prints PASS/FAIL output for one test file.
 *
 * @param {string} file
 * @param {TestResults} results
 * @param {number} ms
 * @param {string} baseURL
 * @param {{
 * 	quiet?: boolean
 * 	log?: boolean
 * 	warn?: boolean
 * 	error?: boolean
 * }} opts
 */
export function report(file, results, ms, baseURL, opts) {
	const failed = results.failed > 0

	if (!failed) {
		if (!opts.quiet)
			console.log(
				` ${green('PASS')}  ${file}  ${dim(`(${results.passed}) ${ms}ms`)}`,
			)
	} else {
		console.log(` ${red('FAIL')}  ${file}  ${dim(`${ms}ms`)}`)
		console.log(`\n  ${white(`${baseURL}/${file}?test`)} (test)`)
		console.log(`  ${white(`${baseURL}/${file}`)} (source)\n`)

		for (const err of results.errors) {
			// assertion failures (with .title) are shown via their
			// console.error from pota/use/test instead
			if (err.title) continue
			console.log(`  ${err.__event}`)
			console.log(`   `, unpack(err.error || err.reason))
		}
	}

	for (const entry of results.console || []) {
		const t = consoleTypes[entry.type] || consoleTypes.log
		const show =
			opts[entry.type] ||
			(failed && (entry.type === 'error' || entry.type === 'warn'))
		if (!show) continue
		t.fn(`  [${t.label}]`, ...entry.args.map(unpack))
	}
}

/**
 * Prints the final summary line.
 *
 * @param {number} passed
 * @param {number} failed
 * @param {number} printed
 * @param {number} total
 * @param {number} ms
 */
export function summary(passed, failed, printed, total, ms) {
	console.log(
		`\n ${passed} passed, ${failed > 0 ? red(`${failed} failed`) : `${failed} failed`}, ${printed} of ${total} files  ${dim(`${ms}ms`)}\n`,
	)
}
