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
} from '#primitives'

// reactivity utils

export { propsSplit } from '#reactivity'

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
	customElement,

	// rendering
	render,
	insert,
	template,
} from './renderer/@main.js'

export { map, ReactiveMap } from './renderer/map.js'

export { onReady } from './renderer/scheduler.js'

// components

export { Component, makeCallback, lazyComponent } from '#comp'

// events

export {
	addEventListener,
	removeEventListener,
} from './renderer/props/event.js'

// props

export { propDefine, propDefineNS } from './renderer/props/@main.js'
