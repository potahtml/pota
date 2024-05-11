/** Generates a standalone version of pota */

import babel from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'

export default [
	// standalone minified
	{
		input: './standalone.js',
		plugins: [
			resolve({}),
			babel({
				babelHelpers: 'bundled',
				presets: [['pota/babel-preset']],
			}),
			terser(),
		],
		output: [
			{
				format: 'es',
				sourcemap: true,
				sourcemapExcludeSources: true,
				file: '../dist/standalone.js',
			},
		],
	},

	// standalone not minified
	{
		input: './standalone.js',
		plugins: [
			resolve({}),
			babel({
				babelHelpers: 'bundled',
				presets: [['pota/babel-preset']],
			}),
		],
		output: [
			{
				format: 'es',
				sourcemap: true,
				sourcemapExcludeSources: true,
				file: '../dist/standalone.no-min.js',
			},
		],
	},

	// babel plugin
	{
		input: '../babel-preset/plugin.js',
		plugins: [terser()],
		output: [
			{
				file: '../babel-preset/plugin.cjs',
				format: 'cjs',
				sourcemap: false,
			},
		],
		external: [
			'@babel/core',
			'@babel/helper-module-imports',
			'@babel/helper-plugin-utils',
			'@babel/plugin-syntax-jsx',
			'@babel/types',
			'validate-html-nesting',
		],
	},
]
