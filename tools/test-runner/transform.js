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
	'color-bits': '/node_modules/color-bits/build/index.js',
	'color-bits/string': '/node_modules/color-bits/build/string.js',
	'#test': '/tools/test-runner/test.js',
}

// color-bits ships only a CJS build. The browser can't execute CJS as
// ESM, so files under this prefix go through `transformCjsToEsm`
// instead of the Babel pipeline.
const cjsPrefix = '/node_modules/color-bits/build/'

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

/**
 * Minimal CommonJS → ESM transform for the TypeScript-compiled output
 * shipped by color-bits. Scoped to the patterns that package emits —
 * relative `require(...)` with `__importStar`/`__exportStar` helpers,
 * top-level `exports.NAME = VALUE;` assignments, and the `__esModule`
 * marker. Not a general CJS transformer.
 *
 * Approach: keep the original body verbatim (inside the module's top
 * scope, not an IIFE) with synthesized `module`, `exports`, and
 * `require` bindings. Emit a static ESM trailer that reflects each
 * `exports.NAME` write back out as an ES named export.
 *
 * @param {string} source
 * @returns {string}
 */
function transformCjsToEsm(source) {
	let body = source
		.replace(/^\s*["']use strict["'];?\s*$/m, '')
		.replace(
			/Object\.defineProperty\(\s*exports\s*,\s*["']__esModule["']\s*,\s*\{\s*value:\s*true\s*\}\s*\)\s*;?/g,
			'',
		)

	// Hoist `__exportStar(require("./x"), exports)` to top-level
	// `export * from "./x.js"` — the trailer can't statically
	// enumerate names re-exported from sibling modules.
	const starExports = []
	body = body.replace(
		/__exportStar\s*\(\s*require\s*\(\s*["']([^"']+)["']\s*\)\s*,\s*exports\s*\)\s*;?/g,
		(_, spec) => {
			starExports.push(
				`export * from ${JSON.stringify(resolveCjsSpec(spec))};`,
			)
			return ''
		},
	)

	const requires = new Map()
	let i = 0
	for (const m of body.matchAll(
		/require\s*\(\s*["']([^"']+)["']\s*\)/g,
	)) {
		if (!requires.has(m[1])) requires.set(m[1], `__req_${i++}`)
	}

	const exportNames = new Set()
	for (const m of body.matchAll(/\bexports\.(\w+)\s*=/g)) {
		if (m[1] !== '__esModule') exportNames.add(m[1])
	}

	let output = ''
	for (const [spec, varName] of requires) {
		output += `import * as ${varName} from ${JSON.stringify(resolveCjsSpec(spec))};\n`
	}
	for (const line of starExports) output += line + '\n'
	if (requires.size > 0) {
		output +=
			`const __reqMap = { ` +
			[...requires]
				.map(([s, v]) => `${JSON.stringify(s)}: ${v}`)
				.join(', ') +
			` };\n`
		// `__esModule: true` tags the object so `__importStar` short-circuits.
		output += `const require = spec => ({ ...__reqMap[spec], __esModule: true });\n`
	}
	output += `const module = { exports: {} };\nconst exports = module.exports;\n`
	output += body + '\n'
	output += `export default module.exports;\n`
	// Alias through fresh `__ex_N` bindings so the ESM exports don't collide
	// with top-level function/const declarations of the same name in the
	// CJS body (e.g. `function alpha(...)` alongside `exports.alpha = alpha`).
	let idx = 0
	for (const name of exportNames) {
		const local = `__ex_${idx++}`
		output += `const ${local} = module.exports.${name};\nexport { ${local} as ${name} };\n`
	}
	return output
}

/**
 * @param {string} spec
 * @returns {string}
 */
function resolveCjsSpec(spec) {
	return spec === '.' || spec === './' ? './index.js' : spec + '.js'
}

// mtime-based cache

/** @type {Map<string, { mtime: number; code: string }>} */
const cache = new Map()

/**
 * Transforms a file through Babel (or the CJS→ESM path for color-bits)
 * with mtime caching.
 *
 * @param {string} filePath
 */
export function transform(filePath) {
	const mtime = fs.statSync(filePath).mtimeMs
	const cached = cache.get(filePath)
	if (cached && cached.mtime === mtime) return cached.code

	const normalized = filePath.replace(/\\/g, '/')
	if (normalized.includes(cjsPrefix)) {
		const code = transformCjsToEsm(fs.readFileSync(filePath, 'utf8'))
		cache.set(filePath, { mtime, code })
		return code
	}

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
