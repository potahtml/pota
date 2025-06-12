// VERSION

export { version } from './version.js'

// REACTIVITY

export {
	asyncEffect,
	batch,
	cleanup,
	cleanupCancel,
	effect,
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

export { setAttribute } from './core/props/attribute.js'
export { setProperty } from './core/props/property.js'

export { setElementStyle as setStyle } from './core/props/style.js'
export { setElementClass as setClass } from './core/props/class.js'

export { propsPlugin, propsPluginNS } from './core/props/plugin.js'

export { propsSplit } from './core/props/propsSplit.js'

export { getValue } from './lib/std.js'
