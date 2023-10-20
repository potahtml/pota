// jsx

export type * from '../pota.d.ts'

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
} from './lib/reactivity/primitives/solid.js'

// reactivity utils

export {
	lazyMemo,
	propsSplit,
	propsData,
} from './lib/reactivity/@main.js'

// components

export * from './components/flow/@main.js'

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

// render utils

export {
	Component,
	makeCallback,
	lazyComponent,
	customElement,
} from './lib/comp/@main.js'

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
