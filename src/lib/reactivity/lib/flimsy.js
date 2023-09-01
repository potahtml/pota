import {
	createRoot,
	createEffect,
	onCleanup,
	createSignal,
	createMemo,
	untrack,
	batch,
} from 'flimsy'

const signal = (a, b) => {
	const r = createSignal(a, b)
	markReactive(r[0])
	return r
}
const memo = (a, b) => markReactive(createMemo(a, b))

export {
	createRoot as root,
	createEffect as renderEffect,
	createEffect as effect,
	onCleanup as cleanup,
	signal,
	memo,
	untrack,
	batch,
}

import { markReactive } from '#reactivity'
