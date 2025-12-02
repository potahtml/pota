// this script creates importmap.json and types.json for use in docs/monaco

import {
	append,
	filesRecursive,
	isDirectory,
	read,
	readdir,
	watch,
	write,
} from './utils.js'

// continuously watch

let timeout

watch('./', () => {
	clearTimeout(timeout)
	timeout = setTimeout(run, 5000)
})

process.on('exit', run) // run on exit

function run() {
	let changedSomething = false

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

		changedSomething =
			changedSomething ||
			write(
				'./src/release/importmap.json',
				`{ "imports": {

"pota": "/node_modules/pota/src/exports.js",

"pota/babel-preset": "/node_modules/pota/src/babel-preset/index.js",
"pota/jsx-runtime": "/node_modules/pota/src/jsx/jsx-runtime.js",
"pota/jsx-dev-runtime": "/node_modules/pota/src/jsx/jsx-runtime.js",

"pota/xml": "/node_modules/pota/src/core/xml.js",
"pota/components": "/node_modules/pota/src/components/@main.js",

${use.join(',\n')},

${lib.join(',\n')}

}}`,
			)
	}

	// types

	{
		const types = []

		const files = filesRecursive('./')

		for (const file of files) {
			if (
				!isDirectory(file) &&
				!file.includes('node_modules') &&
				file.includes('.d.ts') &&
				!file.includes('.d.ts.map')
			) {
				types.push({
					f: file.replace(/\\/g, '/').replace(/^\.\//, 'pota/'),
					c: read(file),
				})
			}
		}

		const importmap = JSON.parse(read('./src/release/importmap.json'))
		for (const moduleName in importmap.imports) {
			if (
				moduleName === 'pota/jsx-runtime' ||
				moduleName === 'pota/jsx-dev-runtime'
			) {
				types.push({
					f: moduleName + '/index.d.ts',
					c: `export * from "pota/types/exports.d.ts"`,
				})
			} else {
				types.push({
					f: moduleName + '/index.d.ts',
					c: `export * from "${importmap.imports[moduleName].replace(/^.*\/pota\/src\//, 'pota/types/').replace(/\.js$/, '.d.ts')}"`,
				})
			}
		}

		changedSomething =
			changedSomething ||
			write('./src/release/types.json', JSON.stringify(types))
	}

	if (changedSomething) {
		console.log('Generated importmap.json and types.json')
	}

	// fix ts for some reason doesnt want to icnlude these files
	const exportsDTS = read('./types/exports.d.ts')
	const definitions = `
export type * from '../pota.d.ts'
export type * from '../src/jsx/jsx.d.ts'
`

	if (!exportsDTS.includes(definitions.trim())) {
		append('./types/exports.d.ts', definitions)
	}
}
