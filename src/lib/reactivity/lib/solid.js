import {
	createRoot,
	createRenderEffect,
	createEffect,
	onCleanup,
	createSignal,
	createMemo,
	untrack,
	batch,
} from 'solid-js' // /dist/dev.js

const signal = (a, b) => {
	const r = createSignal(a, b)
	markReactive(r[0])
	return r
}

const memo = (a, b, c) => markReactive(createMemo(a, b, c))

export {
	createRoot as root,
	createRenderEffect as renderEffect,
	createEffect as effect,
	onCleanup as cleanup,
	signal,
	memo,
	untrack,
	batch,
}

import { markReactive } from '#reactivity'
