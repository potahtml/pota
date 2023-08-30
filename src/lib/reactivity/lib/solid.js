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

const context = defaultValue => {
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
	signal,
	memo,
	untrack,
	batch,
	context,
	useContext,
}

import { children } from '#main'
import { markReactive } from '#reactivity'
