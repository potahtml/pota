// this script creates importmap.json and types.json for use in docs/monaco

import { createRequire } from 'node:module'

import { buildSync } from 'esbuild'

import {
	escapeRegex,
	filesRecursive,
	green,
	isDirectory,
	read,
	readdir,
	watch,
	write,
} from './utils.js'

const require = createRequire(import.meta.url)

if (process.argv.includes('-w')) {
	let timeout
	watch('./', () => {
		clearTimeout(timeout)
		timeout = setTimeout(run, 5000)
	})
}

function run() {
	let changedSomething = []

	// color-bits (used by src/use/color.js) ships CommonJS only, which a
	// browser importmap can't load — bundle each entry point to ESM for
	// the playground. esbuild won't synthesize named exports from CJS,
	// so feed it a facade that re-exports the names require() reports.
	// Bundled independently (`string` inlines its own copy of the core):
	// the library is pure functions over numbers, so the duplication is
	// harmless. Routed through write() so watch mode doesn't retrigger
	// itself on identical output.

	{
		const bundle = entry => {
			// require via the public subpath — the package's exports map
			// (`"./*": "./build/*"`) would double the build/ segment
			const names = Object.keys(
				require(entry === 'index' ? 'color-bits' : `color-bits/${entry}`),
			).filter(name => name !== 'default' && name !== '__esModule')
			return buildSync({
				stdin: {
					contents: `export { ${names.join(', ')} } from './node_modules/color-bits/build/${entry}.js'`,
					resolveDir: process.cwd(),
				},
				bundle: true,
				format: 'esm',
				write: false,
			}).outputFiles[0].text
		}

		for (const entry of ['index', 'string']) {
			changedSomething.push(
				write(`./generated/docs/color-bits/${entry}.js`, bundle(entry)),
			)
		}
	}

	// importmap

	{
		const use = readdir('./src/use')
			.filter(x => x.endsWith('.js'))
			.map(
				x =>
					`"pota/use/${x.replace(/\.js$/, '')}": "/node_modules/pota/src/use/${x}"`,
			)

		const lib = readdir('./src/lib')
			.filter(
				x =>
					x.endsWith('.js') &&
					!x.endsWith('solid.js') &&
					!x.endsWith('std.js') &&
					!x.endsWith('reactive.js'),
			)
			.map(
				x =>
					`"pota/${x.replace(/.js$/, '')}": "/node_modules/pota/src/lib/${x}"`,
			)

		changedSomething.push(
			write(
				'./generated/docs/importmap.json',
				`{ "imports": {

"pota": "/node_modules/pota/src/exports.js",

"pota/babel-preset": "/node_modules/pota/babel-preset/babel-preset.js",
"pota/jsx-runtime": "/node_modules/pota/src/jsx/jsx-runtime.js",
"pota/jsx-dev-runtime": "/node_modules/pota/src/jsx/jsx-runtime.js",

"pota/xml": "/node_modules/pota/src/core/xml.js",
"pota/components": "/node_modules/pota/src/components/@main.js",
"pota/components/Linkify": "/node_modules/pota/src/components/linkify/linkify.js",

${use.join(',\n')},

${lib.join(',\n')},

"color-bits": "/node_modules/pota/generated/docs/color-bits/index.js",
"color-bits/string": "/node_modules/pota/generated/docs/color-bits/string.js"

}}`,
			),
		)
	}

	// types

	{
		const types = []

		const files = filesRecursive('./')

		// Build alias rewrites from package.json `imports` so the
		// playground resolves Node subpath imports (`#foo/*`) under
		// Monaco's legacy NodeJs resolution (which doesn't understand
		// `#` subpath imports). Each alias target is normalised to a
		// bare specifier whose first segment matches a file or folder
		// already registered under `node_modules/` in the virtual FS.
		const pkg = JSON.parse(read('./package.json'))
		const aliasRewrites = Object.entries(pkg.imports || {}).map(
			([from, to]) => {
				const target = String(to).replace(/^\.\//, '')
				if (from.endsWith('/*') && target.endsWith('/*')) {
					return {
						from: from.slice(0, -1), // "#type/"
						to: target.slice(0, -1), // "typescript/private/"
						prefix: true,
					}
				}
				return { from, to: target, prefix: false }
			},
		)

		const rewriteAliases = content => {
			for (const r of aliasRewrites) {
				if (r.prefix) {
					// Match `"#type/`, `'#type/`, `` `#type/ ``
					content = content.replace(
						new RegExp(`(['"\`])${escapeRegex(r.from)}`, 'g'),
						`$1${r.to}`,
					)
				} else {
					// Match the exact specifier as a quoted string
					content = content.replace(
						new RegExp(`(['"\`])${escapeRegex(r.from)}(['"\`])`, 'g'),
						`$1${r.to}$2`,
					)
				}
			}
			return content
		}

		for (const file of files) {
			if (
				!file.includes('projects/') &&
				!file.includes('node_modules/') &&
				!isDirectory(file) &&
				file.includes('.d.ts') &&
				!file.includes('.d.ts.map')
			) {
				types.push({
					f: file.replace(/\\/g, '/').replace(/^\.\//, 'pota/'),
					c: rewriteAliases(read(file)),
				})
			}
		}

		// color-bits types: its real build/*.d.ts plus root redirect files,
		// so `import 'color-bits'` / 'color-bits/string' resolve in the
		// editor's virtual FS (which has no package.json to point at them).
		for (const file of readdir('./node_modules/color-bits/build')) {
			if (file.endsWith('.d.ts')) {
				types.push({
					f: 'color-bits/build/' + file,
					c: read('./node_modules/color-bits/build/' + file),
				})
			}
		}
		types.push(
			{ f: 'color-bits/index.d.ts', c: 'export * from "./build/index"' },
			{
				f: 'color-bits/string.d.ts',
				c: 'export * from "./build/string"',
			},
		)

		const importmap = JSON.parse(
			read('./generated/docs/importmap.json'),
		)
		for (const moduleName in importmap.imports) {
			// color-bits is handled above — the generated redirect below
			// only makes sense for modules whose types live in pota's tree
			if (moduleName.startsWith('color-bits')) continue
			if (
				moduleName === 'pota/jsx-runtime' ||
				moduleName === 'pota/jsx-dev-runtime'
			) {
				types.push({
					f: moduleName + '/index.d.ts',
					c: `export * from "typescript/exports.d.ts"`,
				})
			} else {
				types.push({
					f: moduleName + '/index.d.ts',
					c: `export * from "${importmap.imports[moduleName].replace(/^.*\/?pota\/src\//, 'generated/types/').replace(/\.js$/, '.d.ts')}"`,
				})
			}
		}

		changedSomething.push(
			write('./generated/docs/types.json', JSON.stringify(types)),
		)
	}

	if (changedSomething.some(x => x)) {
		console.log(
			`Generated ${green('importmap.json')} and ${green('types.json')}\n`,
		)
	}
}

run()
