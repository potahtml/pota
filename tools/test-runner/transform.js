// Babel transform with import rewriting and mtime cache

import { transformSync } from '@babel/core'
import fs from 'fs'
import path from 'path'

const root = process.cwd()
const presetPath = path.join(root, 'babel-preset/babel-preset.js')

// bare specifier → local source path

/** @type {Record<string, string>} */
const imports = {
	pota: '/src/exports.js',
	'pota/jsx-runtime': '/src/jsx/jsx-runtime.js',
	'pota/jsx-dev-runtime': '/src/jsx/jsx-runtime.js',
	'pota/components': '/src/components/@main.js',
	'pota/store': '/src/lib/store.js',
	'pota/xml': '/src/core/xml.js',
	'colorjs.io': '/node_modules/colorjs.io/dist/color.js',
	'#test': '/tools/test-runner/test.js',
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

/**
 * Babel plugin: injects the source line number as a third argument to
 * `test('title', fn)` calls so the runner can print clickable
 * file:line links for failing tests. Only annotates calls whose
 * `test` identifier resolves to a direct import of pota's test
 * function (`pota/use/test` or the `#test` alias). Local wrappers
 * named `test` and inner helpers shadowing the name are left alone.
 */
function annotateTestLine() {
	return {
		visitor: {
			CallExpression(path) {
				const callee = path.node.callee
				if (callee.type !== 'Identifier' || callee.name !== 'test')
					return
				if (path.node.arguments.length >= 3) return
				const binding = path.scope.getBinding('test')
				if (!binding || binding.kind !== 'module') return
				const importDecl = binding.path.parent
				if (importDecl.type !== 'ImportDeclaration') return
				const source = importDecl.source.value
				if (source !== 'pota/use/test' && source !== '#test') return
				const line = path.node.loc?.start.line
				if (!line) return
				path.node.arguments.push({
					type: 'NumericLiteral',
					value: line,
				})
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
		plugins: [rewriteImports, annotateTestLine],
		sourceMaps: 'inline',
	}).code

	cache.set(filePath, { mtime, code })
	return code
}

/** Invalidates the transform cache so files are re-compiled. */
export function clearCache() {
	cache.clear()
}
