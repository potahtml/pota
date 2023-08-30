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
} from 'flimsy'

const signal = (a, b) => {
	const r = createSignal(a, b)
	markReactive(r[0])
	return r
}
const memo = (a, b) => markReactive(createMemo(a, b))

const context = defaultValue => {
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
}

export {
	createRoot as root,
	createEffect as renderEffect,
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
