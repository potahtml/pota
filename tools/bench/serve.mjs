// Compiles and serves the standalone benchmark page for the bench
// runner / profiler. Replaces the old dependency on pota.docs's
// external dev server: everything the bench needs now lives in
// `tools/bench/js-framework-benchmark/`.
//
// `buildBench()` bundles `index.jsx` into `main.js` (+ `main.js.map`)
// with esbuild, running the pota Babel preset on the JSX exactly like
// the test runner does (`tools/test-runner/bundle.js`). Bare `pota` /
// `pota/components` / `pota/use/*` specifiers resolve to local `src/`
// via `package.json` `"exports"`. Output is an IIFE so the page's
// classic `<script src="main.js">` loads it, and it's written to disk
// (gitignored) so `index.html` can also be opened directly in a
// browser. Not minified — the profiler reads frame names from
// `main.js`, so mangling would make its reports unreadable.
//
// `startBenchServer()` builds, then serves the folder over HTTP on an
// ephemeral localhost port; returns `{ url, close }`.

import esbuild from 'esbuild'
import { transformSync } from '@babel/core'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(__dirname, '../..')
const APP_DIR = path.join(__dirname, 'js-framework-benchmark')
const ENTRY = path.join(APP_DIR, 'index.jsx')
const OUT = path.join(APP_DIR, 'main.js')
const potaPreset = path.join(REPO, 'babel-preset/babel-preset.js')

// esbuild onLoad plugin: run pota's Babel preset on the page's `.jsx`
// (the only JSX in the graph). pota's own `src/*.js` modules go
// through esbuild's parser directly.
const babelPlugin = {
	name: 'pota-babel',
	/** @param {import('esbuild').PluginBuild} build */
	setup(build) {
		build.onLoad({ filter: /\.jsx$/ }, args => {
			const source = fs.readFileSync(args.path, 'utf8')
			const out = transformSync(source, {
				filename: args.path,
				presets: [potaPreset],
				sourceMaps: 'inline',
			})
			return { contents: out.code, loader: 'js' }
		})
	},
}

/** Bundle `index.jsx` into `main.js` + `main.js.map` on disk. */
export async function buildBench() {
	await esbuild.build({
		entryPoints: [ENTRY],
		outfile: OUT,
		bundle: true,
		format: 'iife',
		platform: 'browser',
		target: 'es2022',
		sourcemap: true,
		sourcesContent: true,
		plugins: [babelPlugin],
		logLevel: 'silent',
	})
}

const MIME = {
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.css': 'text/css',
	'.map': 'application/json',
	'.svg': 'image/svg+xml',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.ttf': 'font/ttf',
	'.eot': 'application/vnd.ms-fontobject',
}

/**
 * Build the page, then serve `APP_DIR` over HTTP on an ephemeral
 * localhost port.
 *
 * @returns {Promise<{ url: string; close: () => Promise<void> }>}
 *   `url` is the benchmark page; `close()` stops the server (call it so
 *   the process can exit — an open listener keeps Node alive).
 */
export async function startBenchServer() {
	await buildBench()

	const server = http.createServer((req, res) => {
		let rel = decodeURIComponent((req.url || '/').split('?')[0])
		if (rel === '/') rel = '/index.html'
		const filePath = path.join(APP_DIR, path.normalize(rel))
		// keep requests inside APP_DIR (no `../` traversal)
		if (
			filePath !== APP_DIR &&
			!filePath.startsWith(APP_DIR + path.sep)
		) {
			res.writeHead(403)
			res.end('forbidden')
			return
		}
		fs.readFile(filePath, (err, data) => {
			if (err) {
				res.writeHead(404)
				res.end('not found')
				return
			}
			res.writeHead(200, {
				'content-type':
					MIME[path.extname(filePath)] || 'application/octet-stream',
			})
			res.end(data)
		})
	})

	await new Promise(resolve =>
		server.listen(0, '127.0.0.1', () => resolve()),
	)
	const { port } = /** @type {import('node:net').AddressInfo} */ (
		server.address()
	)
	const url = `http://localhost:${port}/index.html`
	const close = () =>
		new Promise(resolve => server.close(() => resolve()))

	return { url, close }
}
