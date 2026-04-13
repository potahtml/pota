import { readFileSync } from 'fs'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'

/** Transforms the babel-plugin from `es` to `cjs` */
const preset = {
	input: 'babel-preset/babel-preset.js',
	plugins: [terser()],
	output: [
		{
			file: 'generated/babel-preset.cjs',
			format: 'cjs',
			sourcemap: false,
		},
	],
	external: [
		'@babel/core',
		'@babel/helper-module-imports',
		'@babel/helper-plugin-utils',
		'@babel/plugin-syntax-jsx',
		'parse5',
	],
	watch: {
		clearScreen: false,
	},
}

/**
 * Builds a single browser bundle: @babel/standalone + pota preset.
 *
 * @babel/standalone exposes internal packages at
 * Babel.packages.{types,template,...} and registered plugins at
 * Babel.availablePlugins. We shim @babel/core, @babel/types, and
 * @babel/plugin-syntax-jsx to read from those globals, avoiding
 * bundling duplicates of large packages.
 *
 * The @babel/types shim uses syntheticNamedExports so CJS consumers
 * (e.g. @babel/helper-module-imports doing `require("@babel/types")`)
 * can destructure properties without us listing all 1355 exports.
 */

/**
 * @type {Record<
 * 	string,
 * 	string | { code: string; syntheticNamedExports: boolean }
 * >}
 */
const shims = {
	'@babel/core': `
		const p = globalThis.Babel.packages
		export const types = p.types
		export const template = p.template
		export default globalThis.Babel
	`,
	'@babel/types': {
		code: `export default globalThis.Babel.packages.types`,
		syntheticNamedExports: true,
	},
	'@babel/plugin-syntax-jsx': `
		export default {
			default: globalThis.Babel.availablePlugins['syntax-jsx'],
		}
	`,
	assert: `
		export default function assert(condition, message) {
			if (!condition) throw new Error(message || 'Assertion failed')
		}
	`,
}

/** Rollup plugin that intercepts imports and returns shim code. */
const shimPlugin = {
	name: 'browser-shims',
	/** @param {string} source */
	resolveId(source) {
		if (source in shims) return '\0shim:' + source
		return null
	},
	/** @param {string} id */
	load(id) {
		if (!id.startsWith('\0shim:')) return null
		const shim = shims[id.slice(6)]
		if (!shim) return null
		return shim
	},
}

const standalone = {
	input: 'babel-preset/babel-preset-standalone.js',
	output: {
		file: 'generated/babel-preset-standalone.js',
		format: 'iife',
		sourcemap: false,
		banner: readFileSync(
			'node_modules/@babel/standalone/babel.js',
			'utf8',
		),
	},
	plugins: [shimPlugin, resolve(), commonjs(), terser()],
	watch: {
		clearScreen: false,
	},
}

export default [preset, standalone]
