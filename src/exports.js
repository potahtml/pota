// VERSION

export { version } from './version.js'

// REACTIVITY

export {
	action,
	asyncEffect,
	batch,
	catchError,
	cleanup,
	context,
	derived,
	effect,
	externalSignal,
	isResolved,
	map,
	memo,
	on,
	owned,
	ref,
	resolve,
	root,
	signal,
	syncEffect,
	untrack,
	unwrap,
	withValue,
	// components
	isComponent,
	makeCallback,
	markComponent,
	Pota,
	// events
	addEvent,
	removeEvent,
	// debug
	owner,
	listener,
} from './lib/reactive.js'

// RENDERER

export {
	Component,
	Fragment,
	insert,
	render,
	toHTML,
} from './core/renderer.js'

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

export { getValue } from './lib/std.js'
