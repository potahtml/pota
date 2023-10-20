// reactivity

export {
	signal,
	memo,
	root,
	renderEffect,
	effect,
	batch,
	cleanup,
	cleanup as onCleanup,
	untrack,
	context,
} from '#primitives'

// reactivity utils

export { lazyMemo, propsSplit, propsData } from '#reactivity'

// components

export { Collapse } from './components/flow/Collapse.jsx'
export { Dynamic } from './components/flow/Dynamic.js'
export { For } from './components/flow/For.js'
export { Portal } from './components/flow/Portal.js'
export { Show } from './components/flow/Show.js'
export { Switch, Match } from './components/flow/Switch.js'

// renderer

export {
	// components
	create,
	// rendering
	render,
	insert,
	template,
	// lifecycle
	onReady,
	// children
	children,
	resolve,
	// utils
	map,
	ReactiveMap,
	getPropsData,
} from './renderer/@main.js'

// classes

export {
	Component,
	makeCallback,
	lazyComponent,
	customElement,
} from '#comp'

// events

export {
	addEventListener,
	removeEventListener,
} from './renderer/props/event.js'

// props

export {
	propDefine,
	propDefineNS,
} from './renderer/props/@main.js'
