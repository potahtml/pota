// VERSION

export { version } from './version.js'

// REACTIVITY

export {
	batch,
	cleanup,
	effect,
	renderEffect,
	root,
	signal,
	memo,
	withOwner,
	untrack,
} from './lib/reactivity/primitives/solid.js'

export { syncEffect } from './lib/reactivity/syncEffect.js'
export { writable } from './lib/reactivity/writable.js'
export { mutable } from './lib/reactivity/mutable.js'
export { mutableDeep } from './lib/reactivity/mutableDeep.js'
export { withValue } from './lib/reactivity/withValue.js'

export {
	/**
	 * To set and read refs. To use in ref attribute.
	 *
	 * @param {any} [value] - Optional initial value
	 * @returns {Signal}
	 */
	functionSignal as ref,
} from './lib/reactivity/functionSignal.js'

export { map } from './lib/reactivity/map.js'

// COMPONENTS

export * from './components/flow/@main.js'

// RENDERER

export {
	// rendering
	render,
	Component,
	/**
	 * Do not expose insert. As removal of the element on where you
	 * inserted into, wont cause disposal of what you inserted.
	 */
	// insert,

	// children
	toHTML,
	resolve,
	context,
} from './renderer/@renderer.js'
export { lazy } from './lib/reactivity/lazy.js'

export { css } from './lib/css/css.js'

export { ready } from './renderer/scheduler.js'

// COMPONENTS UTILITIES

export { makeCallback } from './lib/component/makeCallback.js'
export { markComponent } from './lib/component/markComponent.js'
export { isComponent } from './lib/component/isComponent.js'

export {
	CustomElement,
	customElement,
} from './lib/component/CustomElement.js'

// COMPONENTS CLASSES

export { Pota } from './lib/component/Pota.js'

// reactivity
export { isReactive } from './lib/reactivity/isReactive.js'

// EVENTS

export {
	addEventListener,
	removeEventListener,
} from './renderer/props/event.js'

// PROPS

export {
	setAttribute,
	setProperty,
	setStyle,
	setBool,
} from './renderer/props/@main.js'

export {
	propsPlugin,
	propsPluginNS,
} from './renderer/props/plugin.js'
export { propsProxy } from './renderer/props/proxy.js'
export { propsSplit } from './renderer/props/propsSplit.js'

// LIB

export { getValue } from './lib/std/getValue.js'
