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
	ref,
	resolve,
	root,
	signal,
	syncEffect,
	untrack,
	withValue,
	writable,
} from './lib/reactive.js'

// RENDERER

export {
	Component,
	context,
	insert,
	render,
	toHTML,
} from './renderer.js'

// COMPONENTS

export {
	isComponent,
	makeCallback,
	markComponent,
	Pota,
} from './lib/reactive.js'

// EVENTS

export {
	addEventListener,
	removeEventListener,
} from './lib/reactive.js'

export { ready } from './scheduler.js'

// PROPS

export {
	setAttribute,
	setBool,
	setProperty,
	setStyle,
	setClass,
} from './props/@main.js'

export {
	propsPlugin,
	propsPluginBoth,
	propsPluginNS,
} from './props/plugin.js'

export { propsSplit } from './props/propsSplit.js'

// std

export { css } from './lib/std.js'
