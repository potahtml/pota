import terser from '@rollup/plugin-terser'

export default [
	// babel plugin cjs
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
			'validate-html-nesting',
		],
	},
]
