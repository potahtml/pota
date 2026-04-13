// CLI test runner — scan, launch Puppeteer, report results

/** @import {Browser} from "puppeteer" */

import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import { startServer } from './serve.js'
import { clearCache } from './transform.js'
import { filesRecursive, watch, dim } from '../utils.js'
import { report, summary } from './report.js'

// --- config (package.json "test" + cli flags) ---

const root = process.cwd()
const pkg = JSON.parse(
	fs.readFileSync(path.join(root, 'package.json'), 'utf8'),
)
const config = pkg.test || {}

const testDir = config.dir || 'tests/api/'
const timeout = config.timeout || 5_000
const rerunTimeout = 5_000
const concurrency = config.concurrency || 10
const testExts = config.extensions || ['.jsx', '.tsx', '.ts']
/** @type {string[]} */
const ignore = config.ignore || []

const args = process.argv.slice(2)
const doWatch = args.includes('--watch') || args.includes('-w')
const bail = args.includes('--bail')
const quiet = args.includes('--quiet') || args.includes('-q')
const reportOpts = {
	quiet,
	log: args.includes('--log'),
	warn: args.includes('--warn'),
	error: args.includes('--error'),
}
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
 * 	errors: object[]
 * 	console: { type: string; args: unknown[] }[]
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

	try {
		await page.goto(`${baseURL}/${file}?test`, {
			waitUntil: 'load',
		})
		await page.waitForFunction(
			() => window.__pota_results__?.done === true,
			{ timeout },
		)

		return await page.evaluate(() => window.__pota_results__)
	} catch (e) {
		return {
			passed: 0,
			failed: 1,
			errors: [{ __event: 'error', error: e.message }],
			console: [],
		}
	} finally {
		await page.close().catch(() => {})
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
			failed += e.results.failed
			report(e.file, e.results, e.ms, baseURL, reportOpts)
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
	summary(passed, failed, printed, files.length, ms)

	return { passed, failed, bailed }
}

// --- watch mode ---

/** Launches a fresh browser instance. */
function launchBrowser() {
	return puppeteer.launch({
		headless: true,
		args: ['--disable-ipc-flooding-protection'],
	})
}

/**
 * Watches src/ and tests/ for changes and re-runs affected files.
 *
 * @param {string} baseURL
 */
async function startWatching(baseURL) {
	let browser = await launchBrowser()
	process.on('exit', () => browser.close().catch(() => {}))

	const initial = await runSuite(browser, baseURL, scanTests())

	console.log(`  ${dim('Watching for changes...')}\n`)

	let running = false
	let pending = null
	let timer = null
	let lastBailed = !!initial.bailed
	let lastFailed = initial.failed > 0
	let runCount = 0
	const recycleEvery = 10

	function schedule(only) {
		// after a bail, always re-run the full suite
		if (lastBailed || pending === null || !only) {
			pending = undefined
		} else {
			pending = pending || []
			for (const f of only) if (!pending.includes(f)) pending.push(f)
		}
		clearTimeout(timer)
		timer = setTimeout(run, rerunTimeout)
	}

	async function run() {
		clearTimeout(timer)

		if (running) {
			timer = setTimeout(run, rerunTimeout)
			return
		}
		running = true

		// recycle browser to avoid memory leaks
		if (++runCount % recycleEvery === 0) {
			await browser.close().catch(() => {})
			browser = await launchBrowser()
		}

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

process.on('exit', () => server.close())
process.on('SIGINT', () => process.exit())
process.on('SIGTERM', () => process.exit())

if (doWatch) {
	startWatching(baseURL)
} else {
	const browser = await launchBrowser()
	const { failed } = await runSuite(browser, baseURL, scanTests())
	await browser.close()
	process.exit(failed > 0 ? 1 : 0)
}
