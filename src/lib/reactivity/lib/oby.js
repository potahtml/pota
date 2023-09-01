// setup
import $, { root, effect, cleanup, memo, untrack, batch } from 'oby'

const _effect = v => effect(v)
const renderEffect = v => effect(v, { sync: 'init' })
const signal = (a, b) => {
	const s = $(a, b)
	return [markReactive(() => s()), s]
}
const _memo = (a, b) => markReactive(memo(a, b))

export {
	root,
	renderEffect,
	_effect as effect,
	cleanup,
	signal,
	_memo as memo,
	untrack,
	batch,
}

import { markReactive } from '#reactivity'
