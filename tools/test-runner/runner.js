// CLI test runner — scan, launch Puppeteer, report results

/** @import {Browser} from "puppeteer" */

import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import { startServer } from './serve.js'
import { clearCache } from './transform.js'
import {
	filesRecursive,
	watch,
	red,
	green,
	dim,
	white,
} from '../utils.js'

// --- config (package.json "test" + cli flags) ---

const root = process.cwd()
const pkg = JSON.parse(
	fs.readFileSync(path.join(root, 'package.json'), 'utf8'),
)
const config = pkg.test || {}

const testDir = config.dir || 'tests/api/'
const timeout = config.timeout || 5000
const concurrency = config.concurrency || 10
const testExts = config.extensions || ['.jsx', '.tsx', '.ts']
/** @type {string[]} */
const ignore = config.ignore || []

const args = process.argv.slice(2)
const doWatch = args.includes('--watch') || args.includes('-w')
const bail = args.includes('--bail')
const quiet = args.includes('--quiet') || args.includes('-q')
const filter = args.find(
	a => !a.startsWith('--') && !a.startsWith('-'),
)

// watch mode: stable port from config (so URLs stay the same across
// reruns). one-shot: random port (avoids collisions with concurrent
// runs).
const port = doWatch ? config.port || 0 : 0

if (!quiet) console.clear()

/**
 * @typedef {{
 * 	passed: number
 * 	failed: number
 * 	errors: { title: string; error: string }[]
 * 	pageErrors: string[]
 * 	done?: boolean
 * }} TestResults
 */

// --- scan test files ---

/**
 * Finds test files in testDir, filtered by CLI argument.
 *
 * @returns {string[]}
 */
function scanTests() {
	return filesRecursive(path.join(root, testDir))
		.filter(f => testExts.some(ext => f.endsWith(ext)))
		.map(f => f.slice(root.length + 1))
		.filter(f => !filter || f.includes(filter))
		.filter(f => filter || !ignore.some(i => f.includes(i)))
		.sort()
}

// --- run a single test file in a browser tab ---

/**
 * Runs a single test file in a browser tab and collects results.
 *
 * @param {Browser} browser
 * @param {string} baseURL
 * @param {string} file
 * @returns {Promise<TestResults>}
 */
async function runFile(browser, baseURL, file) {
	const page = await browser.newPage()

	await page.bringToFront()
	await page.emulateFocusedPage(true)

	const pageErrors = []

	page.on('pageerror', err => pageErrors.push(err.message))
	page.on('error', err => pageErrors.push(err.message))
	page.on('console', msg => {
		const text = msg.text()
		// if (msg.type() === 'log') console.log('    [page]', text)
		if (msg.type() === 'error') {
			if (
				text !=
				'Failed to load resource: the server responded with a status of 404 (Not Found)'
			)
				pageErrors.push(text)
		}
	})

	try {
		await page.goto(`${baseURL}/${file}?test`, {
			waitUntil: 'load',
		})
		await page.waitForFunction(
			() => window.__pota_results__?.done === true,
			{ timeout },
		)

		const results = await page.evaluate(() => window.__pota_results__)
		results.pageErrors = pageErrors
		return results
	} catch (e) {
		return {
			passed: 0,
			failed: 1,
			errors: [{ title: file, error: e.message }],
			pageErrors,
		}
	} finally {
		await page.close().catch(() => {})
	}
}

// --- print results for one file ---

/**
 * Prints PASS/FAIL output for one test file.
 *
 * @param {string} file
 * @param {TestResults} results
 * @param {number} ms
 * @param {string} baseURL
 */
function report(file, results, ms, baseURL) {
	const failed = results.failed > 0 || results.pageErrors.length > 0

	if (!failed) {
		if (!quiet)
			console.log(
				` ${green('PASS')}  ${file}  ${dim(`(${results.passed}) ${ms}ms`)}`,
			)
		return
	}

	console.log(` ${red('FAIL')}  ${file}  ${dim(`${ms}ms`)}`)
	console.log(`  ${white(`${baseURL}/${file}?test`)}`)

	for (const err of results.errors)
		console.log(`  ${err.title}\n    ${err.error}`)

	let prev
	for (const err of results.pageErrors) {
		if (err !== prev) console.log(`  ${err}`)
		prev = err
	}
}

// --- run all files with parallel workers ---

/**
 * Runs all test files with parallel workers and prints a summary.
 *
 * @param {Browser} browser
 * @param {string} baseURL
 * @param {string[]} files
 * @returns {Promise<{
 * 	passed: number
 * 	failed: number
 * 	bailed?: boolean
 * }>}
 */
async function runSuite(browser, baseURL, files) {
	if (!files.length) {
		console.log(
			' No test files found' +
				(filter ? ` matching "${filter}"` : ''),
		)
		return { passed: 0, failed: 0 }
	}

	let passed = 0
	let failed = 0
	let bailed = false
	const start = performance.now()

	// ordered output: track results per slot, flush in order
	const entries = files.map(file => ({
		file,
		results: null,
		ms: 0,
	}))
	let next = 0
	let printed = 0

	function flush() {
		while (
			!bailed &&
			printed < entries.length &&
			entries[printed].results
		) {
			const e = entries[printed++]
			passed += e.results.passed
			failed += e.results.failed + e.results.pageErrors.length
			report(e.file, e.results, e.ms, baseURL)
			if (failed > 0 && bail) bailed = true
		}
	}

	async function worker() {
		while (!bailed) {
			const idx = next++
			if (idx >= files.length) break

			const t = performance.now()
			entries[idx].results = await runFile(
				browser,
				baseURL,
				files[idx],
			)
			entries[idx].ms = (performance.now() - t) | 0

			flush()
		}
	}

	const workers = Math.min(concurrency, files.length)
	await Promise.all(Array.from({ length: workers }, () => worker()))
	flush()

	const ms = (performance.now() - start) | 0
	console.log(
		`\n ${green(passed)} passed, ${failed > 0 ? red(`${failed} failed`) : `${failed} failed`}, ${printed} of ${files.length} files  ${dim(`${ms}ms`)}\n`,
	)

	return { passed, failed, bailed }
}

// --- watch mode ---

/**
 * Watches src/ and tests/ for changes and re-runs affected files.
 *
 * @param {Browser} browser
 * @param {string} baseURL
 * @param {boolean} [initialBailed]
 */
function startWatching(browser, baseURL, initialBailed) {
	console.log(`  ${dim('Watching for changes...')}\n`)

	let running = false
	let pending = null
	let timer = null
	let lastBailed = !!initialBailed
	let lastFailed = initialBailed

	function schedule(only) {
		// after a bail, always re-run the full suite
		if (lastBailed || pending === null || !only) {
			pending = undefined
		} else {
			pending = pending || []
			for (const f of only) if (!pending.includes(f)) pending.push(f)
		}
		clearTimeout(timer)
		timer = setTimeout(run, 500)
	}

	async function run() {
		clearTimeout(timer)

		if (running) {
			timer = setTimeout(run, 500)
			return
		}
		running = true

		const only = lastBailed ? undefined : pending || undefined
		pending = null
		clearCache()

		if (!quiet) {
			console.clear()
			process.stdout.write('\x1Bc')
		}

		const files = only || scanTests()
		const label = only ? only.join(', ') : 'all tests'
		console.log(`${dim(`--- re-running ${label} ---`)}\n`)

		const result = await runSuite(browser, baseURL, files)
		lastBailed = result.bailed

		// partial re-run passed but last full run had failures: re-run all
		if (only && result.failed === 0 && lastFailed) {
			lastFailed = false
			pending = undefined
			running = false
			return run()
		}

		lastFailed = result.failed > 0

		console.log(`  ${dim('Watching for changes...')}\n`)
		running = false
	}

	watch(path.join(root, 'src/'), () => schedule())
	watch(path.join(root, 'tests/'), (_, filename) => {
		if (!filename) return schedule()
		const rel = 'tests/' + filename
		if (testExts.some(ext => rel.endsWith(ext))) {
			schedule([rel])
		} else {
			schedule()
		}
	})
}

// --- main ---

const { server, port: actualPort } = await startServer(port)
const baseURL = `http://localhost:${actualPort}`

const browser = await puppeteer.launch({
	headless: true,
	args: ['--disable-ipc-flooding-protection'],
})

/*// doesnt work
const context = browser.defaultBrowserContext()
await context.overridePermissions(baseURL, ['fullscreen'])
*/
process.on('exit', () => {
	browser.close().catch(() => {})
	server.close()
})
process.on('SIGINT', () => process.exit())
process.on('SIGTERM', () => process.exit())

const initial = await runSuite(browser, baseURL, scanTests())

if (doWatch) {
	startWatching(browser, baseURL, initial.bailed)
} else {
	process.exit(initial.failed > 0 ? 1 : 0)
}
