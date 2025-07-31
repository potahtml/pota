export {
	Fragment,
	Component as jsx,
	Component as jsxDEV,
	Component as jsxs,

	// custom transform
	createComponent,
	createPartial,
	createChildren,
} from '../core/renderer.js'

// inlined

export {
	setConnected,
	setDisconnected,
} from '../core/props/lifecycle.js'
export { setEvent } from '../core/props/event.js'
export { setCSS } from '../core/props/css.js'
export { setStyleNS, setStyle } from '../core/props/style.js'
export {
	assignProp,
	assignProps,
	assignPropNS,
} from '../core/props/@main.js'
