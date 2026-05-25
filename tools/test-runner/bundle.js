// esbuild-based bundler. Produces one self-contained bundle per test
// entry — every dependency inlined, a single inline sourcemap for
// debugging + coverage. The browser never sees bare specifiers or
// CJS; esbuild resolves everything via `package.json` `"exports"` +
// `"imports"`.

import esbuild from 'esbuild'
import { transformSync } from '@babel/core'
import fs from 'fs'
import path from 'path'

const root = process.cwd()
const potaPreset = path.join(root, 'babel-preset/babel-preset.js')

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
			CallExpression(p) {
				const callee = p.node.callee
				if (callee.type !== 'Identifier' || callee.name !== 'test')
					return
				if (p.node.arguments.length >= 3) return
				const binding = p.scope.getBinding('test')
				if (!binding || binding.kind !== 'module') return
				const importDecl = binding.path.parent
				if (importDecl.type !== 'ImportDeclaration') return
				const source = importDecl.source.value
				if (source !== 'pota/use/test' && source !== '#test') return
				const line = p.node.loc?.start.line
				if (!line) return
				p.node.arguments.push({
					type: 'NumericLiteral',
					value: line,
				})
			},
		},
	}
}

/**
 * Esbuild onLoad plugin: runs pota's Babel preset on .jsx/.tsx and
 * preset-typescript on .ts/.tsx. Plain .js files go straight through
 * esbuild's own parser (faster).
 */
const babelPlugin = {
	name: 'pota-babel',
	/** @param {import('esbuild').PluginBuild} build */
	setup(build) {
		build.onLoad({ filter: /\.(jsx|tsx|ts)$/ }, args => {
			const source = fs.readFileSync(args.path, 'utf8')
			const ext = path.extname(args.path)
			const isJSX = ext === '.jsx' || ext === '.tsx'
			const isTS = ext === '.ts' || ext === '.tsx'
			const presets = []
			if (isJSX) presets.push(potaPreset)
			if (isTS)
				presets.push([
					'@babel/preset-typescript',
					{ isTSX: isJSX, allExtensions: isJSX },
				])
			const out = transformSync(source, {
				filename: args.path,
				presets,
				plugins: [annotateTestLine],
				sourceMaps: 'inline',
			})
			return { contents: out.code, loader: 'js' }
		})
	},
}

// Bundle cache: absolute entry path → bundle source. Cleared between
// watch-mode re-runs; per-process only in one-shot mode.

/** @type {Map<string, string>} */
const cache = new Map()

/**
 * Bundles a test entry into a single self-contained module. Wraps the
 * user's test file in a synthetic entry that imports it for side
 * effects (tests register on import), then calls `run()` from `#test`
 * to flush results. The inline sourcemap points at original sources
 * so DevTools and c8 see real file paths.
 *
 * @param {string} entryPath Absolute path to a test file.
 * @returns {Promise<string>}
 */
export async function bundle(entryPath) {
	const cached = cache.get(entryPath)
	if (cached) return cached

	const synthetic = [
		`import ${JSON.stringify(entryPath)}`,
		`import { run } from '#test'`,
		`await run()`,
		'',
	].join('\n')

	const result = await esbuild.build({
		stdin: {
			contents: synthetic,
			resolveDir: root,
			sourcefile: '<test-entry>',
			loader: 'js',
		},
		bundle: true,
		format: 'esm',
		write: false,
		sourcemap: 'inline',
		sourcesContent: true,
		platform: 'browser',
		target: 'es2022',
		plugins: [babelPlugin],
		// pota's package.json declares `sideEffects: false`. Test files
		// depend on top-level `test(...)` calls as side effects to
		// register cases — so we must preserve all side effects when
		// bundling tests, even for bare `import 'foo.jsx'` entries.
		ignoreAnnotations: true,
		logLevel: 'silent',
	})

	const code = result.outputFiles[0].text
	cache.set(entryPath, code)
	return code
}

/** Invalidates the bundle cache so subsequent requests re-bundle. */
export function clearCache() {
	cache.clear()
}
