// VERSION

import pkg from '../package.json'
const version = pkg.version
export { version }

// REACTIVITY

export {
	batch,
	cleanup as onCleanup,
	cleanup,
	effect,
	lazyMemo,
	memo,
	renderEffect,
	root,
	signal,
	untrack,
	withOwner,
} from './lib/reactivity/primitives/solid.js'

// REACTIVITY UTILS

export { map } from './renderer/map.js'

// JSX COMPONENTS

export * from './components/flow/@main.js'

// RENDERER

export {
	// rendering
	create,
	customElement,
	render,
	template,
	/**
	 * Do not expose insert. As removal of the element on where you
	 * inserted into, wont cause disposal of what you inserted.
	 */
	// insert,

	// children
	toHTML,
	resolve,

	// reactivity
	context,
	ref,
	lazy,
} from './renderer/@main.js'

export { onReady } from './renderer/scheduler.js'

// COMPONENTS

export { Component } from './lib/comp/@main.js'

// EVENTS

export {
	addEventListener,
	removeEventListener,
} from './renderer/props/event.js'

// PROPS

export { propsPlugin, propsPluginNS } from './renderer/props/@main.js'
export { propsSplit } from './renderer/props/propsSplit.js'
