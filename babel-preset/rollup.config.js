import terser from '@rollup/plugin-terser'

/** Transforms the babel-plugin from es to cjs */

export default [
	{
		input: './index.js',
		plugins: [terser()],
		output: [
			{
				file: './index.cjs',
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
	},
]
