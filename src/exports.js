// VERSION

export { version } from './version.js'

// REACTIVITY

export {
	asyncEffect,
	batch,
	cleanup,
	context,
	effect,
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
	derived,
	isDerived,
	// components
	isComponent,
	makeCallback,
	markComponent,
	// events
	addEvent,
	removeEvent,
} from './lib/reactive.js'

// RENDERER

export { Component, insert, render, toHTML } from './core/renderer.js'

// EVENTS

export { ready, readyAsync } from './core/scheduler.js'

// PROPS

export { setAttribute } from './core/props/attribute.js'
export { setProperty } from './core/props/property.js'

export { setElementStyle as setStyle } from './core/props/style.js'
export {
	setElementClass as setClass,
	setClassList,
} from './core/props/class.js'

export { propsPlugin, propsPluginNS } from './core/props/plugin.js'

export { getValue } from './lib/std.js'
