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
