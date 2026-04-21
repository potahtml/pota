// Coverage collection for the test-runner.
//
// Collects raw V8 coverage from each Puppeteer page, rewrites served
// URLs (http://localhost:PORT/src/foo.js) to file:// URLs with the
// inline source map attached, and writes one JSON per page into
// generated/coverage/tmp/ in the NODE_V8_COVERAGE shape. c8 renders
// the final report from that directory.

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

	const srcPrefix = baseURL + '/src/'
	const result = []
	/** @type {Record<string, { lineLengths: number[]; data: unknown; url: null }>} */
	const sourceMapCache = {}

	for (const entry of entries) {
		if (!entry.url.startsWith(srcPrefix)) continue
		const raw = entry.rawScriptCoverage
		if (!raw) continue

		const relative = entry.url.slice(baseURL.length + 1)
		const fileURL = pathToFileURL(path.join(root, relative)).href

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
		],
		{ stdio: 'inherit', cwd: root },
	)
	console.log(
		`\n HTML report: ${path.relative(root, path.join(reportDir, 'index.html'))}\n`,
	)
}
