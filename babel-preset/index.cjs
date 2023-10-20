// the purpose of the preset is to transform jsx using the automatic runtime
// and to rename the import of the selected reactive library in use

module.exports = function (context, options = { lib: 'solid' }) {
	const lib = options.lib || 'solid'

	if (lib !== 'flimsy' && lib !== 'oby' && lib !== 'solid')
		throw new Error(`
\`pota/babel-preset\`: \`lib\` option should be one of the following:
flimsy, oby, solid
`)

	return {
		plugins: [
			[
				'@babel/plugin-transform-react-jsx',
				{
					runtime: 'automatic',
					importSource: 'pota',

					throwIfNamespace: false,
					useSpread: true,
					useBuiltIns: false,
				},
			],
			[
				'transform-rename-import',
				{
					replacements: [
						{
							original: '#primitives',
							replacement: '#primitives/' + lib + '.js',
						},
					],
				},
			],
		],
	}
}
