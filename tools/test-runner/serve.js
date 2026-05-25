// HTTP server that serves the test harness and bundled test files

import http from 'http'
import fs from 'fs'
import path from 'path'
import { bundle } from './bundle.js'

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

// HTML page that loads a test bundle and exposes results

/**
 * Returns an HTML page that loads the bundled test and exposes
 * results. The bundle self-drives — imports the test file for side
 * effects, then awaits `run()` from `#test` to mark done.
 *
 * @param {string} file
 */
function harness(file) {
	return `<!DOCTYPE html>
<html>
<script>
window.__pota_results__ = { passed: 0, failed: 0, errors: [], console: [], done: false }

// pack: convert objects to plain serializable form
function pack(arg) {
  if (typeof arg === 'object' && arg !== null) {
    if (arg instanceof ErrorEvent) {
      return { __event: 'error', error: pack(arg.error || arg.message), filename: arg.filename, lineno: arg.lineno }
    }
    if (arg instanceof PromiseRejectionEvent) {
      return { __event: 'rejection', reason: pack(arg.reason) }
    }
    if (arg.stack || arg.message) {
      const o = { __error: true, message: arg.message, stack: arg.stack }
      if (arg.cause) o.cause = pack(arg.cause)
      return o
    }
    return arg
  }
  return arg
}

// capture console calls with raw structured arguments
;(function() {
  const origLog = console.log
  const origWarn = console.warn
  const origError = console.error

  function capture(type, args) {
    window.__pota_results__.console.push({
      type: type,
      args: Array.from(args).map(pack)
    })
  }
  console.log = function() { capture('log', arguments); origLog.apply(console, arguments) }
  console.warn = function() { capture('warn', arguments); origWarn.apply(console, arguments) }
  console.error = function() { capture('error', arguments); origError.apply(console, arguments) }
})()

window.addEventListener('error', e => {
  window.__pota_results__.errors.push(pack(e))
  window.__pota_results__.failed++
  window.__pota_results__.done = true
})
window.addEventListener('unhandledrejection', e => {
  window.__pota_results__.errors.push(pack(e))
  window.__pota_results__.failed++
  window.__pota_results__.done = true
})
</script>
<script type="module" src="/${file}"></script>
<body></body>
</html>`
}

/**
 * Serves a JS file as a bundle. Non-JS files are served as-is.
 *
 * @param {import('http').ServerResponse} res
 * @param {string} filePath
 */
async function serveFile(res, filePath) {
	const ext = path.extname(filePath)
	const mime = mimeTypes[ext] || 'application/octet-stream'
	res.writeHead(200, { 'Content-Type': mime })

	if (jsExts.has(ext)) {
		res.end(await bundle(filePath))
	} else {
		res.end(fs.readFileSync(filePath))
	}
}

/**
 * Starts an HTTP server that serves the test harness and bundled test
 * files.
 *
 * @param {number} port
 * @returns {Promise<{
 * 	server: import('http').Server
 * 	port: number
 * }>}
 */
export function startServer(port) {
	return new Promise(resolve => {
		const server = http.createServer(async (req, res) => {
			const url = new URL(req.url, 'http://localhost')

			// test harness page
			if (url.searchParams.get('test') === '') {
				res.writeHead(200, { 'Content-Type': 'text/html' })
				res.end(harness(url.pathname.replace(/^\//, '')))
				return
			}

			// browsers auto-request favicon; serve empty to avoid 404 noise
			if (url.pathname === '/favicon.ico') {
				res.writeHead(200, { 'Content-Type': 'image/x-icon' })
				res.end()
				return
			}

			// static / bundled files
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
				await serveFile(res, filePath)
			} catch (e) {
				// return bundling errors as valid JS so the browser shows
				// the real message instead of a parse error
				const msg =
					/** @type {Error} */ (e).message ||
					String(e).replace(/\\/g, '\\\\').replace(/`/g, '\\`')
				if (!res.headersSent)
					res.writeHead(500, {
						'Content-Type': 'application/javascript',
					})
				res.end(`throw new Error(\`${msg}\`)`)
			}
		})

		server.listen(port, () => {
			const addr = server.address()
			const actualPort =
				addr && typeof addr === 'object' ? addr.port : 0
			resolve({ server, port: actualPort })
		})
	})
}
