/**
 * The purpose of the preset is to transform JSX using the automatic
 * runtime from `plugin-transform-react-jsx`.
 *
 * The babel preset and the library, reside on the same repository, so
 * you never get into a conflict on which the compiler and the library
 * wont match.
 *
 * Usage of the preset is very simple. To the babel config you may add
 *
 * `"presets": [["pota/babel-preset"]]`
 *
 * If time and motivation ever allows, it would be nice to provide a
 * custom JSX transform to make the output code smaller and possibly
 * faster, as JSX output _the React way_ it's very verbose.
 */

module.exports = function () {
	return {
		plugins: [[__dirname + '/plugin.cjs']],
	}
}
