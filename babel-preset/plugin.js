/** This file is compiled with rollup to ./plugin.cjs */

import createPlugin from './transform/@main.js'

export default createPlugin({
	name: 'transform-pota-jsx',
})
