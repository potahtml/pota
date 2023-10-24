// VERSION

import pkg from '../package.json' assert { type: 'json' }
const version = pkg.version
export { version as v }

// REACTIVITY

export {
	batch,
	children,
	cleanup as onCleanup,
	cleanup,
	context,
	effect,
	lazyMemo,
	memo,
	renderEffect,
	root,
	signal,
	untrack,
} from '#primitives'

// REACTIVITY UTILS

export { map, ReactiveMap } from './renderer/map.js'

// JSX COMPONENTS

export { Collapse } from './components/flow/Collapse.jsx'
export { Dynamic } from './components/flow/Dynamic.js'
export { For } from './components/flow/For.js'
export { Portal } from './components/flow/Portal.js'
export { Show } from './components/flow/Show.js'
export { Switch, Match } from './components/flow/Switch.js'

// RENDERER

export {
	create,
	customElement,
	render,
	template,
	/**
	 * Do not expose insert. As removal of the element on where you
	 * inserted into, wont cause disposal of what you inserted.
	 */
	// insert,
} from './renderer/@main.js'

export { onReady } from './renderer/scheduler.js'

// COMPONENTS

export { Component, makeCallback, lazy } from '#comp'

// EVENTS

export {
	addEventListener,
	removeEventListener,
} from './renderer/props/event.js'

// PROPS

export { propDefine, propDefineNS } from './renderer/props/@main.js'
export { propsSplit } from '#comp'
