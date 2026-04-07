// Automated browser test for the all-in-one babel-standalone bundle.
// Launches Puppeteer, loads test.html, reports pass/fail.

import puppeteer from 'puppeteer'
import http from 'http'
import fs from 'fs'
import path from 'path'

const root = path.resolve(
	path.dirname(new URL(import.meta.url).pathname),
	'../../..',
)

const mimeTypes = {
	'.js': 'application/javascript',
	'.html': 'text/html',
}

/** Static file server for the standalone bundle and test page. */
const server = http.createServer((req, res) => {
	const filePath = path.join(
		root,
		new URL(req.url, 'http://localhost').pathname,
	)

	if (
		!fs.existsSync(filePath) ||
		fs.statSync(filePath).isDirectory()
	) {
		res.writeHead(404)
		res.end('Not found')
		return
	}

	const ext = path.extname(filePath)
	res.writeHead(200, {
		'Content-Type': mimeTypes[ext] || 'application/octet-stream',
	})
	res.end(fs.readFileSync(filePath))
})

/** Launches Puppeteer, loads test.html, and reports pass/fail. */
async function run() {
	await new Promise(r => server.listen(0, r))
	const port = server.address().port

	const browser = await puppeteer.launch({
		headless: true,
		args: ['--no-sandbox'],
	})

	try {
		const page = await browser.newPage()

		page.on('pageerror', async err => {
			const testName = await page
				.evaluate(() => window.__standalone_current_test__)
				.catch(() => null)
			if (testName) {
				console.error(`page error in "${testName}":`, err.message)
			} else {
				console.error('page error:', err.message)
			}
		})

		await page.goto(
			`http://localhost:${port}/src/babel-preset-standalone/test/index.html`,
			{ waitUntil: 'domcontentloaded' },
		)

		const results = await page.waitForFunction(
			() =>
				window.__standalone_results__?.done &&
				window.__standalone_results__,
			{ timeout: 15000 },
		)

		const data = await results.jsonValue()
		console.log(
			await page.$eval('#output', el => el.textContent),
		)

		if (data.failed > 0) {
			process.exitCode = 1
			for (const err of data.errors) {
				console.error(`  FAIL: ${err.title} — ${err.error}`)
			}
		}
	} finally {
		await browser.close()
		server.close()
	}
}

run()
