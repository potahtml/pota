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
	children,
	lazyMemo,
} from './lib/reactivity/primitives/solid.js'

// reactivity utils

export { propsSplit } from './lib/reactivity/@main.js'

// components

export * from './components/flow/@main.js'

// renderer

export {
	// components
	create,
	customElement,

	// rendering
	render,
	insert,
	template,
} from './renderer/@main.js'

export { map, ReactiveMap } from './renderer/map.js'

export { onReady } from './renderer/scheduler.js'

// components

export {
	Component,
	makeCallback,
	lazyComponent,
} from './lib/comp/@main.js'

// events

export {
	addEventListener,
	removeEventListener,
} from './renderer/props/event.js'

// props

export { propDefine, propDefineNS } from './renderer/props/@main.js'
