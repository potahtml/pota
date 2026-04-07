// Babel transform with import rewriting and mtime cache

import { transformSync } from '@babel/core'
import fs from 'fs'
import path from 'path'

const root = process.cwd()
const presetPath = path.join(root, 'src/babel-preset')

// bare specifier → local source path

/** @type {Record<string, string>} */
const imports = {
	pota: '/src/exports.js',
	'pota/jsx-runtime': '/src/jsx/jsx-runtime.js',
	'pota/jsx-dev-runtime': '/src/jsx/jsx-runtime.js',
	'pota/components': '/src/components/@main.js',
	'pota/store': '/src/lib/store.js',
	'pota/xml': '/src/core/xml.js',
	'#test': '/tools/test/test.js',
}

/** Babel plugin that rewrites bare specifiers to local source paths. */
function rewriteImports() {
	return {
		visitor: {
			'ImportDeclaration|ExportNamedDeclaration|ExportAllDeclaration'(
				path,
			) {
				const source = path.node.source
				if (!source) return

				const value = source.value
				if (imports[value]) {
					source.value = imports[value]
				} else if (value.startsWith('pota/use/')) {
					source.value =
						'/src/use/' + value.slice('pota/use/'.length) + '.js'
				}
			},
		},
	}
}

// mtime-based cache

/** @type {Map<string, { mtime: number; code: string }>} */
const cache = new Map()

/**
 * Transforms a file through Babel with mtime caching.
 *
 * @param {string} filePath
 */
export function transform(filePath) {
	const mtime = fs.statSync(filePath).mtimeMs
	const cached = cache.get(filePath)
	if (cached && cached.mtime === mtime) return cached.code

	const ext = path.extname(filePath)
	const isJSX = ext === '.jsx' || ext === '.tsx'
	const isTS = ext === '.ts' || ext === '.tsx'

	const presets = []
	if (isJSX) presets.push(presetPath)
	if (isTS)
		presets.push([
			'@babel/preset-typescript',
			{ isTSX: isJSX, allExtensions: isJSX },
		])

	const code = transformSync(fs.readFileSync(filePath, 'utf8'), {
		filename: filePath,
		presets,
		plugins: [rewriteImports],
		sourceMaps: 'inline',
	}).code

	cache.set(filePath, { mtime, code })
	return code
}

/** Invalidates the transform cache so files are re-compiled. */
export function clearCache() {
	cache.clear()
}
