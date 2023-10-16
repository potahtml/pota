// reactivity

export {
	root,
	renderEffect,
	effect,
	cleanup,
	cleanup as onCleanup,
	signal,
	memo,
	untrack,
	batch,
} from '#primitives'

// reactivity utils

export {
	lazyMemo,
	selector,
	propsMerge,
	propsSplit,
	propsData,
} from '#reactivity'

// components

export { Collapse } from '#components/flow/Collapse.jsx'
export { Dynamic } from '#components/flow/Dynamic.js'
export { For } from '#components/flow/For.js'
export { Portal } from '#components/flow/Portal.js'
export { Show } from '#components/flow/Show.js'
export { Switch, Match } from '#components/flow/Switch.js'

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

export { Component } from '#comp'

// render utils

export { makeCallback, lazyComponent, customElement } from '#comp'

// events

export { addEvent, removeEvent } from './renderer/props/event.js'

// props

export {
	registerProp,
	registerPropNS,
} from './renderer/props/@main.js'
