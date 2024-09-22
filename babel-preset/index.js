/**
 * The purpose of the preset is to transform JSX using
 * `transform-pota-jsx`, which is a modified version of
 * `transform-react-jsx` to produce code similar to the output of
 * [`dom-expressions`](https://github.com/ryansolid/dom-expressions),
 * and when `development` is true to add debugging information for
 * using with `pota dev tools` [WIP].
 *
 * The babel preset and the library, reside on the same repository, so
 * you never get into a conflict on which the compiler and the library
 * wont match.
 *
 * To the babel config you may add the preset
 *
 * `"presets": [["pota/babel-preset"]]`
 *
 * While `pota` still works with `transform-react-jsx`, it's
 * recommended to use this preset instead, as it generates optimized
 * partials which are much faster and smaller.
 *
 * Option `development` could be passed to the preset as follows to
 * use with `pota dev tools`.
 *
 * `"presets": [["pota/babel-preset", { "development": true }]]`
 */

/** This file is compiled with rollup to ./index.cjs */

import createPlugin from './transform/@main.js'

export default function (ctx, options = { development: false }) {
	return {
		plugins: [
			[
				createPlugin({
					name: 'transform-pota-jsx',
				}),
				options,
			],
		],
	}
}
