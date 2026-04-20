// this script creates importmap.json and types.json for use in docs/monaco

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

if (process.argv.includes('-w')) {
	let timeout
	watch('./', () => {
		clearTimeout(timeout)
		timeout = setTimeout(run, 5000)
	})
}

function run() {
	let changedSomething = []

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

${use.join(',\n')},

${lib.join(',\n')}

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
						new RegExp(
							`(['"\`])${escapeRegex(r.from)}(['"\`])`,
							'g',
						),
						`$1${r.to}$2`,
					)
				}
			}
			return content
		}

		for (const file of files) {
			if (
				!isDirectory(file) &&
				!file.includes('node_modules') &&
				file.includes('.d.ts') &&
				!file.includes('.d.ts.map')
			) {
				types.push({
					f: file.replace(/\\/g, '/').replace(/^\.\//, 'pota/'),
					c: rewriteAliases(read(file)),
				})
			}
		}

		const importmap = JSON.parse(
			read('./generated/docs/importmap.json'),
		)
		for (const moduleName in importmap.imports) {
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
