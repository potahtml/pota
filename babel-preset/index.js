// the purpose of the preset is to transform jsx using the automatic runtime
// and to rename the import of the reactive library in use

export default function (context, options = { reactivity: 'solid' }) {
	const reactivity = options.reactivity || 'solid'
	if (
		reactivity !== 'flimsy' &&
		reactivity !== 'oby' &&
		reactivity !== 'solid' &&
		reactivity !== 'solid-dev'
	)
		throw new Error(
			`
      \`reactivity\` option \`pota/babel-preset\` should be one of the following:
       flimsy, oby, solid, solid-dev
      `,
		)

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
							replacement: '#reactivity-lib/' + reactivity + '.js',
						},
					],
				},
			],
		],
	}
}
