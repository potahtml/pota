// Coverage collection for the test-runner.
//
// Each test is served as a single bundle with an inline sourcemap
// (sourcesContent included). V8 reports coverage against the bundle
// URL; the sourcemap encodes which lines came from which original
// source file. We capture raw V8 coverage from each Puppeteer page,
// rewrite served URLs (http://localhost:PORT/tests/foo.jsx) to
// file:// URLs with the inline sourcemap attached, and write one
// JSON per page into generated/coverage/tmp/ in the NODE_V8_COVERAGE
// shape. c8 walks the sourcemaps to attribute coverage back to
// originals under src/ and filters via `--include=src/**`.

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { pathToFileURL } from 'url'
import { spawnSync } from 'child_process'

const root = process.cwd()
const reportDir = path.join(root, 'generated/coverage')
const tmpDir = path.join(reportDir, 'tmp')
const c8Bin = path.join(root, 'node_modules/c8/bin/c8.js')

/**
 * Wipes previous coverage output and creates the tmp dir. Returns
 * false (with an error printed) if c8 isn't installed.
 */
export function prepare() {
	if (!fs.existsSync(c8Bin)) {
		console.error(
			'Coverage requires c8. Install with: npm install --save-dev c8',
		)
		return false
	}
	fs.rmSync(reportDir, { recursive: true, force: true })
	fs.mkdirSync(tmpDir, { recursive: true })
	return true
}

/**
 * Begins collecting V8 coverage on a Puppeteer page. Must be called
 * before the page navigates.
 *
 * @param {import('puppeteer').Page} page
 */
export function startPage(page) {
	return page.coverage.startJSCoverage({
		includeRawScriptCoverage: true,
		resetOnNavigation: false,
	})
}

/**
 * Stops coverage, filters to served src/ files, and writes one JSON
 * payload into tmpDir. No-op if nothing in src/ executed.
 *
 * @param {import('puppeteer').Page} page
 * @param {string} baseURL
 */
export async function stopPage(page, baseURL) {
	const entries = await page.coverage.stopJSCoverage()

	const testPrefix = baseURL + '/tests/'
	const jsExts = ['.js', '.jsx', '.ts', '.tsx']
	const result = []
	/** @type {Record<string, { lineLengths: number[]; data: unknown; url: null }>} */
	const sourceMapCache = {}

	for (const entry of entries) {
		// keep only test bundle scripts; skip the harness HTML
		// (URL has a `?test` query) and inline script blocks.
		if (!entry.url.startsWith(testPrefix)) continue
		if (entry.url.includes('?')) continue
		if (!jsExts.some(ext => entry.url.endsWith(ext))) continue
		const raw = entry.rawScriptCoverage
		if (!raw) continue

		const relative = entry.url.slice(baseURL.length + 1)
		// The sourcemap's `sources` entries are relative (e.g.
		// `src/lib/std.js`). v8-to-istanbul resolves them against the
		// bundle URL's directory, so we report the bundle at the
		// project root — `dir(fileURL) + "src/lib/std.js"` then
		// correctly points at the real source file.
		const bundleName =
			'__bundle__' + relative.replace(/[^a-z0-9]/gi, '_')
		const fileURL = pathToFileURL(path.join(root, bundleName)).href

		result.push({
			scriptId: raw.scriptId,
			url: fileURL,
			functions: raw.functions,
		})

		sourceMapCache[fileURL] = {
			lineLengths: entry.text.split('\n').map(l => l.length),
			data: extractInlineSourceMap(entry.text),
			url: null,
		}
	}

	if (!result.length) return

	const id = crypto.randomBytes(8).toString('hex')
	fs.writeFileSync(
		path.join(tmpDir, `coverage-${id}.json`),
		JSON.stringify({ result, 'source-map-cache': sourceMapCache }),
	)
}

/**
 * @param {string} code
 * @returns {unknown}
 */
function extractInlineSourceMap(code) {
	const m =
		/\/\/# sourceMappingURL=data:application\/json(?:;charset=[^,;]+)?;base64,([A-Za-z0-9+/=]+)/.exec(
			code,
		)
	if (!m) return null
	try {
		return JSON.parse(Buffer.from(m[1], 'base64').toString('utf8'))
	} catch {
		return null
	}
}

/**
 * Invokes `c8 report` over the accumulated tmp files. Produces both a
 * text summary on stdout and an HTML report under generated/coverage/.
 */
export function report() {
	const entries = fs
		.readdirSync(tmpDir)
		.filter(f => f.endsWith('.json'))
	if (!entries.length) {
		console.log('\n No coverage collected.\n')
		return
	}

	console.log('')
	spawnSync(
		process.execPath,
		[
			c8Bin,
			'report',
			`--temp-directory=${tmpDir}`,
			`--reports-dir=${reportDir}`,
			'--reporter=text',
			'--reporter=html',
			'--include=src/**',
			// applies --include after sourcemap remap; without this,
			// c8 filters on the bundle URL (which is under /tests/)
			// instead of the original `src/**` files the bundle
			// resolves to, dropping every entry.
			'--exclude-after-remap',
		],
		{ stdio: 'inherit', cwd: root },
	)
	console.log(
		`\n HTML report: ${path.relative(root, path.join(reportDir, 'index.html'))}\n`,
	)
}
