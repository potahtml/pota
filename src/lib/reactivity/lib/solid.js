import { markReactive } from '#reactivity'
import { children } from '#main'
import { empty } from '#std'

import {
	createRoot,
	createRenderEffect,
	createEffect,
	onCleanup,
	createSignal,
	createMemo,
	untrack,
	batch,
	useContext,
	getOwner,
} from 'solid-js' // /dist/dev.js

const signal = (a, b) => {
	const r = createSignal(a, b)
	markReactive(r[0])
	return r
}

const memo = (a, b, c) => markReactive(createMemo(a, b, c))

function context(defaultValue = empty()) {
	const id = Symbol('context')
	const context = { id, defaultValue }

	function Context(newValue, fn) {
		if (newValue === undefined) {
			return useContext(context)
		} else {
			let res
			createRenderEffect(() => {
				untrack(() => {
					const owner = getOwner()
					owner.context = {
						...owner.context,
						[id]: newValue,
					}
					res = fn()
				})
			})

			return res
		}
	}
	Context.Provider = props =>
		Context(props.value, () => children(() => props.children))

	return Context
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
}
