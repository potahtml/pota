/** This file is compiled with rollup to ./plugin.cjs */

import createPlugin from './transform/@main.js'

Object.defineProperty(exports, '__esModule', {
	value: true,
})

exports.default = createPlugin({
	name: 'transform-pota-jsx',
})
