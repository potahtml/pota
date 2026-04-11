// HTTP server that serves transformed JS and the test harness

import http from 'http'
import fs from 'fs'
import path from 'path'
import { transform } from './transform.js'

const root = process.cwd()

const jsExts = new Set(['.js', '.jsx', '.ts', '.tsx'])

const mimeTypes = {
	'.js': 'application/javascript',
	'.jsx': 'application/javascript',
	'.ts': 'application/javascript',
	'.tsx': 'application/javascript',
	'.html': 'text/html',
	'.css': 'text/css',
	'.json': 'application/json',
}

// HTML page that imports a test file, runs it, and exposes results

/**
 * Returns an HTML page that imports, runs, and exposes test results.
 *
 * @param {string} file
 */
function harness(file) {
	return `<!DOCTYPE html>
<html>
<script>
window.__pota_results__ = { passed: 0, failed: 0, errors: [], done: false }
window.addEventListener('error', e => {
  window.__pota_results__.errors.push({
    title: 'uncaught error',
    error: e.message + (e.filename ? ' at ' + e.filename + ':' + e.lineno : ''),
  })
  window.__pota_results__.failed++
  window.__pota_results__.done = true
})
window.addEventListener('unhandledrejection', e => {
  const msg = e.reason?.message || e.reason?.error || String(e.reason)
  window.__pota_results__.errors.push({
    title: 'unhandled rejection',
    error: msg,
  })
  window.__pota_results__.failed++
  window.__pota_results__.done = true
})
</script>
<script type="module">
  await import('/${file}')
  const { run } = await import('/tools/test-runner/test.js')
  await run()
  window.__pota_results__.done = true
</script>
<body></body>
</html>`
}

// serve a file, transforming JS through Babel

/**
 * Serves a file, running JS/JSX/TS/TSX through Babel first.
 *
 * @param {import('http').ServerResponse} res
 * @param {string} filePath
 */
function serveFile(res, filePath) {
	const ext = path.extname(filePath)
	const mime = mimeTypes[ext] || 'application/octet-stream'
	res.writeHead(200, { 'Content-Type': mime })

	if (jsExts.has(ext)) {
		res.end(transform(filePath))
	} else {
		res.end(fs.readFileSync(filePath))
	}
}

/**
 * Starts an HTTP server that serves the test harness and transformed
 * files.
 *
 * @param {number} port
 */
export function startServer(port) {
	return new Promise(resolve => {
		const server = http.createServer((req, res) => {
			const url = new URL(req.url, 'http://localhost')

			// test harness page
			if (url.searchParams.get('test') === '') {
				res.writeHead(200, { 'Content-Type': 'text/html' })
				res.end(harness(url.pathname.replace(/^\//, '')))
				return
			}

			// static / transformed files
			const filePath = path.join(
				root,
				url.pathname.replace(/^\//, ''),
			)

			if (!fs.existsSync(filePath)) {
				res.writeHead(404)
				res.end('404 Not found: ' + url.pathname)
				return
			}

			try {
				serveFile(res, filePath)
			} catch (e) {
				// return syntax/transform errors as valid JS so the
				// browser shows the real message instead of a parse error
				const msg = (e.message || String(e))
					.replace(/\\/g, '\\\\')
					.replace(/`/g, '\\`')
				if (!res.headersSent)
					res.writeHead(500, {
						'Content-Type': 'application/javascript',
					})
				res.end(`throw new Error(\`${msg}\`)`)
			}
		})

		server.listen(port, () =>
			resolve({ server, port: server.address().port }),
		)
	})
}
