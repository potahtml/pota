/**
 * The purpose of the preset is to transform JSX using the automatic
 * runtime from `plugin-transform-react-jsx`. It also allows you to
 * switch the reactive library in use, by renaming the import of the
 * reactive primitives using `transform-rename-import`.
 *
 * The babel preset and the library, reside on the same repository, so
 * you never get into a conflict on which the compiler and the library
 * wont match.
 *
 * Usage of the preset is very simple. To the babel config you may add
 *
 * `"presets": [["pota/babel-preset"]]`
 *
 * By default, it will use solid reactivity [1]. If you would like to
 * use `oby` reactivity instead [2], you may do so by using the option
 * `lib`, as follows:
 *
 * `"presets": [["pota/babel-preset", { lib: 'oby' } ]]`
 *
 * New reactive libraries are welcome, you may do so by adding a file
 * here [3]. With the name of your lib and following the same
 * abstraction that other libraries use on that folder. Then, just
 * edit this file to allow selecting it as a lib.
 *
 * If time and motivation ever allows, it would be nice to provide a
 * custom JSX transform to make the output code smaller and possibly
 * faster, as JSX output _the React way_ it's very verbose.
 *
 * @url [1] https://github.com/solidjs/solid
 * @url [2] https://github.com/vobyjs/oby/tree/master
 * @url [3] https://github.com/potahtml/pota/tree/master/src/lib/reactivity/primitives
 */

module.exports = function (context, options = { lib: 'solid' }) {
	const lib = options.lib || 'solid'

	if (
		lib !== 'oby' &&
		lib !== 'solid' &&
		// the ones marked with "dev" are in progress/broken
		lib !== 'flimsy-dev' &&
		lib !== 'maverick-dev'
	) {
		throw new Error(`
\`pota/babel-preset\`: \`lib\` option should be one of the following:
\`oby\`, \`solid\`, \`flimsy-dev\`, \`maverick-dev\`
`)
	}

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
							original: '^(.+?)/primitives/solid\\.js$',
							replacement: '$1/primitives/' + lib + '.js',
						},
					],
				},
			],
		],
	}
}
