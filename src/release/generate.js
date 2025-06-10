// this script creates importmap.json and types.json for use in docs/monaco

import {
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

// importmap

function run() {
	let changedSomething = false

	{
		const use = readdir('./src/use')
			.filter(x => x.endsWith('.js'))
			.map(
				x =>
					`"pota/use/${x.replace(/\.js$/, '')}": "/node_modules/pota/src/use/${x}"`,
			)

		const lib = readdir('./src/lib')
			.filter(x => x.endsWith('.js') && !x.endsWith('solid.js'))
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
			if (moduleName === 'pota') {
				types.push({
					f: moduleName + '/index.d.ts',
					c: `export * from "${importmap.imports[moduleName].replace(/^.*\/pota\/src\//, 'pota/types/').replace(/\.js$/, '.d.ts')}"
						export * from "pota/pota.d.ts"`,
				})
			} else if (
				moduleName === 'pota/jsx-runtime' ||
				moduleName === 'pota/jsx-dev-runtime'
			) {
				types.push({
					f: moduleName + '/index.d.ts',
					c: `export * from "pota/pota.d.ts"`,
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
}
