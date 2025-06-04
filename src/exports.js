// VERSION

export { version } from './version.js'

// REACTIVITY

export {
	asyncEffect,
	batch,
	cleanup,
	effect,
	isReactive,
	Lazy,
	lazy,
	map,
	memo,
	owned,
	on,
	ref,
	resolve,
	root,
	signal,
	syncEffect,
	untrack,
	withValue,
	writable,
	// components
	isComponent,
	makeCallback,
	markComponent,
	Pota,
	// events
	addEvent,
	removeEvent,
} from './lib/reactive.js'

// RENDERER

export {
	Component,
	context,
	insert,
	render,
	toHTML,
} from './core/renderer.js'

// EVENTS

export { ready } from './core/scheduler.js'

// PROPS

export {
	setAttribute,
	setProperty,
	setStyle,
	setClass,
} from './core/props/@main.js'

export {
	propsPlugin,
	propsPluginBoth,
	propsPluginNS,
} from './core/props/plugin.js'

export { propsSplit } from './core/props/propsSplit.js'

// std

export { css } from './lib/std.js'
