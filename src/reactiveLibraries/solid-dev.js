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
} from 'solid-js/dist/dev.js'

import { setReactiveLibrary, children, markReactive } from '#main'

setReactiveLibrary({
	root: createRoot,
	renderEffect: createRenderEffect,
	effect: createEffect,
	cleanup: onCleanup,
	signal: (a, b) => {
		const r = createSignal(a, b)
		markReactive(r[0])
		return r
	},
	memo: (a, b, c) => markReactive(createMemo(a, b, c)),
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
