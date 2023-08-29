import {
	createRoot,
	createRenderEffect,
	createEffect,
	onCleanup,
	createSignal,
	createMemo,
	untrack,
	useContext,
	getOwner,
	batch,
} from 'solid-js' // /dist/dev.js

const signal = (a, b) => {
	const r = createSignal(a, b)
	markReactive(r[0])
	return r
}

const memo = (a, b, c) => markReactive(createMemo(a, b, c))

function context(defaultValue) {
	const id = Symbol()
	return {
		id,
		defaultValue,
		Provider: function (props) {
			let r
			createRenderEffect(
				() =>
					(r = untrack(() => {
						getOwner().context = {
							[id]: props.value,
						}
						return children(() => props.children)
					})),
			)
			return r
		},
	}
}

export {
	createRoot as root,
	createRenderEffect as renderEffect,
	createEffect as effect,
	onCleanup as cleanup,
	onCleanup,
	signal,
	memo,
	untrack,
	batch,
	context,
	useContext,
}

import { children } from '#main'
import { markReactive } from '#reactivity'

/*
OBY

// setup
import $, {
	root,
	effect,
	cleanup,
	memo,
	untrack,
	context,
	batch,
} from 'oby'

import { setReactiveLibrary, children, markReactive } from '#main'

setReactiveLibrary({
	root: root,
	renderEffect: v => effect(v, { sync: 'init' }),
	effect: v => effect(v, { sync: 'init' }),
	cleanup: cleanup,
	signal: (a, b) => {
		const s = $(a, b)
		return [markReactive(() => s()), s]
	},
	memo: (a, b) => markReactive(memo(a, b)),
	untrack: untrack,
	batch: batch,
	context: defaultValue => {
		const id = Symbol()
		return {
			id,
			defaultValue,
			Provider: function (props) {
				let r
				effect(
					() =>
						(r = () => {
							context({ [id]: props.value })
							return children(() => props.children)
						}),
					{ sync: 'init' },
				)
				return r
			},
		}
	},
	useContext: v => {
		const c = context(v.id)
		return c ?? v.defaultValue
	},
})

// export
export * from '#main'


*/

/*
FLIMSY

// setup

import {
	createRoot,
	createEffect,
	onCleanup,
	createSignal,
	createMemo,
	untrack,
	createContext,
	useContext,
	batch,
} from './lib/flimsy.js'

import { setReactiveLibrary, children, markReactive } from '#main'

setReactiveLibrary({
	root: createRoot,
	renderEffect: createEffect,
	effect: createEffect,
	cleanup: onCleanup,
	signal: (a, b) => {
		const r = createSignal(a, b)
		markReactive(r[0])
		return r
	},
	memo: (a, b) => markReactive(createMemo(a, b)),
	untrack: untrack,
	batch: batch,
	context: function (defaultValue) {
		const context = createContext(defaultValue)
		return {
			...context,
			Provider: function (props) {
				let r
				createEffect(
					() =>
						(r = untrack(() => {
							context.set(props.value)
							return children(() => props.children)
						})),
				)
				return r
			},
		}
	},
	useContext: useContext,
})

// export
export * from '#main'


*/
