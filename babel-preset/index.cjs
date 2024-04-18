'use strict'
/**
 * The purpose of the preset is to transform JSX using
 * `transform-pota-jsx`, which is a modified version of
 * `transform-react-jsx` to produce code similar to the output of
 * `dom-expressions`.
 *
 * The babel preset and the library, reside on the same repository, so
 * you never get into a conflict on which the compiler and the library
 * wont match.
 *
 * Usage of the preset is very simple. To the babel config you may add
 *
 * `"presets": [["pota/babel-preset"]]`
 *
 * While pota still works with `transform-react-jsx`, it's recommended
 * to use this preset instead, as it generates optimized templates
 * which are much faster and smaller.
 */

module.exports = function () {
	return {
		plugins: [[__dirname + '/plugin.cjs']],
	}
}
