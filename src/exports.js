// VERSION

export { version } from './version.js'

// REACTIVITY

export {
	batch,
	cleanup as onCleanup,
	cleanup,
	effect,
	memo,
	renderEffect,
	root,
	signal,
	untrack,
	withOwner,
} from './lib/reactivity/primitives/solid.js'

export { writableMemo } from './lib/reactivity/writableMemo.js'
export { mutable } from './lib/reactivity/mutable.js'
export { mutableDeep } from './lib/reactivity/mutableDeep.js'

export {
	/**
	 * To set and read refs. To use in ref attribute.
	 *
	 * @param {any} [value] - Optional initial value
	 * @returns {Signal}
	 */
	functionSignal as ref,
} from './lib/reactivity/functionSignal.js'

export { map } from './renderer/map.js'

// JSX COMPONENTS

export * from './components/flow/@main.js'

// RENDERER

export {
	// rendering
	create,
	customElement,
	render,
	html,

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
	lazy,
} from './renderer/@main.js'

export { css } from './lib/css/css.js'

export { onReady } from './renderer/scheduler.js'

// COMPONENTS

export { Component } from './lib/comp/@main.js'

// COMPONENTS UTILITIES

// comp
export { makeCallback } from './lib/comp/makeCallback.js'
export { markComponent } from './lib/comp/markComponent.js'
export { isComponent } from './lib/comp/isComponent.js'
export { CustomElement } from './lib/comp/CustomElement.js'

// reactivity
export { isReactive } from './lib/reactivity/isReactive.js'

// EVENTS

export {
	addEventListener,
	removeEventListener,
} from './renderer/props/event.js'

// PROPS

export {
	propsPlugin,
	propsPluginNS,
	setElementAttribute,
	setElementProperty,
	setElementStyle,
} from './renderer/props/@main.js'

export { propsSplit } from './renderer/props/propsSplit.js'

// LIB

export { getValue } from './lib/std/getValue.js'
