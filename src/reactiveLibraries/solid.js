// setup
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
} from 'solid-js'

import { setReactiveLibrary, children, markReactive } from '#main'

setReactiveLibrary({
	root: createRoot,
	renderEffect: createRenderEffect,
	effect: createEffect,
	cleanup: onCleanup,
	signal: (v, equals) => {
		const r = createSignal(v, equals)
		markReactive(r[0])
		return r
	},
	memo: (a, b, c) => {
		const r = createMemo(a, b, c)
		markReactive(r)
		return r
	},
	untrack: untrack,
	batch: batch,
	context: defaultValue => {
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
	},
	useContext: useContext,
})

// export
export * from '#main'
